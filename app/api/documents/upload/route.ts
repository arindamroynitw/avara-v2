import { createClient } from "@/lib/supabase/server";
import { parseBankStatement } from "@/lib/parsing/bank-statement";
import { parseMFStatement } from "@/lib/parsing/mf-statement";
import { parseDematStatement } from "@/lib/parsing/demat-statement";
import {
  materializeBankStatement,
  materializeMFStatement,
  materializeDematStatement,
  generateParsedSummary,
} from "@/lib/parsing/materialize";
import {
  loadConversationState,
  saveConversationState,
} from "@/lib/state/manager";

export const maxDuration = 60;

/**
 * Document upload endpoint.
 * Receives pre-extracted text from client-side PDF processing.
 * Sends text to GPT-4o for structured parsing (no vision, no Files API).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, documentType, fileName } = await req.json();

  if (!text || !documentType) {
    return Response.json(
      { error: "Missing text or documentType" },
      { status: 400 }
    );
  }

  if (text.length < 50) {
    return Response.json(
      {
        documentId: null,
        status: "failed",
        error: "text_too_short",
        message:
          "Could not extract enough text from the PDF. The file might be scanned/image-based. Could you share the key details manually?",
      },
      { status: 400 }
    );
  }

  console.log(
    `[UPLOAD] User ${user.id.substring(0, 8)}...: ${documentType}, file="${fileName}", text=${text.length} chars`
  );

  // Insert document record
  const { data: doc, error: insertError } = await supabase
    .from("uploaded_documents")
    .insert({
      user_id: user.id,
      document_type: documentType,
      file_name: fileName || "document.pdf",
      storage_path: `text_extract/${user.id}/${documentType}/${Date.now()}`,
      file_size: text.length,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    console.error("[UPLOAD] Insert error:", insertError);
    return Response.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }

  const docId = doc.id;

  // Parse with GPT-4o (text mode, not vision)
  console.log(`[UPLOAD] Parsing ${documentType}, docId=${docId}`);
  try {
    let parsedData: Record<string, unknown> = {};
    let state = await loadConversationState(user.id);

    switch (documentType) {
      case "bank_statement": {
        const parsed = await parseBankStatement(text);
        parsedData = parsed as unknown as Record<string, unknown>;
        state = await materializeBankStatement(
          user.id,
          docId,
          parsed,
          state
        );
        break;
      }
      case "mf_statement": {
        const parsed = await parseMFStatement(text);
        parsedData = parsed as unknown as Record<string, unknown>;
        state = await materializeMFStatement(
          user.id,
          docId,
          parsed,
          state
        );
        break;
      }
      case "demat_statement": {
        const parsed = await parseDematStatement(text);
        parsedData = parsed as unknown as Record<string, unknown>;
        state = await materializeDematStatement(
          user.id,
          docId,
          parsed,
          state
        );
        break;
      }
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }

    await supabase
      .from("uploaded_documents")
      .update({
        status: "parsed",
        parsed_data: parsedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId);

    await saveConversationState(user.id, state);

    const summary = generateParsedSummary(documentType, parsedData);

    console.log(`[UPLOAD] SUCCESS ${documentType}, docId=${docId}`);

    return Response.json({
      documentId: docId,
      status: "parsed",
      parsedData,
      summary,
    });
  } catch (error) {
    console.error(`[UPLOAD] FAILED ${documentType}, docId=${docId}:`, error);

    await supabase
      .from("uploaded_documents")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId);

    return Response.json({
      documentId: docId,
      status: "failed",
      error: "parsing_failed",
      message:
        "I had some trouble reading this document. Could you tell me the key details manually?",
    });
  }
}
