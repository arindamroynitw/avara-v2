import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseBankStatement } from "@/lib/parsing/bank-statement";
import { parseMFStatement } from "@/lib/parsing/mf-statement";
import { parseDematStatement } from "@/lib/parsing/demat-statement";
import {
  materializeBankStatement,
  materializeMFStatement,
  materializeDematStatement,
  generateParsedSummary,
} from "@/lib/parsing/materialize";
import { isPdfEncrypted } from "@/lib/parsing/pdf-to-images";
import {
  loadConversationState,
  saveConversationState,
} from "@/lib/state/manager";

export const maxDuration = 60; // Allow up to 60s for PDF parsing

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export async function POST(req: Request) {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const documentType = formData.get("documentType") as string | null;

  if (!file || !documentType) {
    return Response.json(
      { error: "Missing file or documentType" },
      { status: 400 }
    );
  }

  // 3. Validate
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large. Maximum 10MB." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Only PDF, PNG, and JPEG files are accepted." },
      { status: 400 }
    );
  }

  // 4. Upload to Supabase Storage
  const adminClient = getAdminClient();
  const timestamp = Date.now();
  const storagePath = `${user.id}/${documentType}/${timestamp}_${file.name}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from("documents")
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return Response.json(
      { error: "Failed to upload file." },
      { status: 500 }
    );
  }

  // 5. Insert document record
  const { data: doc, error: insertError } = await supabase
    .from("uploaded_documents")
    .insert({
      user_id: user.id,
      document_type: documentType,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    console.error("Document insert error:", insertError);
    return Response.json(
      { error: "Failed to create document record." },
      { status: 500 }
    );
  }

  const docId = doc.id;

  // 6. Check for password protection (PDF only)
  if (file.type === "application/pdf") {
    try {
      const encrypted = await isPdfEncrypted(fileBuffer);
      if (encrypted) {
        await supabase
          .from("uploaded_documents")
          .update({
            status: "failed",
            error_message: "password_protected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", docId);

        return Response.json({
          documentId: docId,
          status: "failed",
          error: "password_protected",
          message:
            "This PDF is password-protected. Please upload an unprotected version.",
        });
      }
    } catch {
      // Continue — not a password issue
    }
  }

  // 7. Parse document
  try {
    let parsedData: Record<string, unknown> = {};
    let state = await loadConversationState(user.id);

    switch (documentType) {
      case "bank_statement": {
        const parsed = await parseBankStatement(fileBuffer);
        parsedData = parsed as unknown as Record<string, unknown>;
        state = await materializeBankStatement(user.id, docId, parsed, state);
        break;
      }
      case "mf_statement": {
        const parsed = await parseMFStatement(fileBuffer);
        parsedData = parsed as unknown as Record<string, unknown>;
        state = await materializeMFStatement(user.id, docId, parsed, state);
        break;
      }
      case "demat_statement": {
        const parsed = await parseDematStatement(fileBuffer);
        parsedData = parsed as unknown as Record<string, unknown>;
        state = await materializeDematStatement(user.id, docId, parsed, state);
        break;
      }
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }

    // Update document as parsed
    await supabase
      .from("uploaded_documents")
      .update({
        status: "parsed",
        parsed_data: parsedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId);

    // Save updated conversation state
    await saveConversationState(user.id, state);

    // Generate summary for chat
    const summary = generateParsedSummary(documentType, parsedData);

    return Response.json({
      documentId: docId,
      status: "parsed",
      parsedData,
      summary,
    });
  } catch (error) {
    console.error("Parsing error:", error);

    await supabase
      .from("uploaded_documents")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Unknown parsing error",
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
