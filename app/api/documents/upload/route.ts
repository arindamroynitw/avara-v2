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
import {
  loadConversationState,
  saveConversationState,
} from "@/lib/state/manager";

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  const documentType = formData.get("documentType") as string | null;
  const inputType = (formData.get("inputType") as string) || "file";

  if (!documentType) {
    return Response.json({ error: "Missing documentType" }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const timestamp = Date.now();

  let storagePath: string;
  let fileSize: number;
  let originalFileName: string;
  let base64Images: string[] | null = null;
  let pdfBuffer: Buffer | null = null;

  if (inputType === "images") {
    // ── Client-decoded images (from password-protected PDFs) ──
    const images = formData.getAll("images") as File[];
    originalFileName =
      (formData.get("fileName") as string) || "document.pdf";

    if (!images.length) {
      return Response.json({ error: "No images provided" }, { status: 400 });
    }

    console.log(
      `[UPLOAD] User ${user.id.substring(0, 8)}...: ${documentType} (${images.length} decoded images from "${originalFileName}")`
    );

    // Convert each image to base64 for OpenAI
    base64Images = [];
    let totalSize = 0;
    for (const img of images) {
      const buf = Buffer.from(await img.arrayBuffer());
      totalSize += buf.length;
      base64Images.push(buf.toString("base64"));
    }
    fileSize = totalSize;

    // Store the first image as a reference in Supabase Storage
    const firstImage = images[0];
    storagePath = `${user.id}/${documentType}/${timestamp}_${originalFileName.replace(".pdf", "")}_pages.png`;
    const firstBuf = Buffer.from(await firstImage.arrayBuffer());
    await adminClient.storage
      .from("documents")
      .upload(storagePath, firstBuf, {
        contentType: "image/png",
        upsert: false,
      });
  } else {
    // ── Raw file upload (unprotected PDFs, images) ──
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File too large. Maximum 10MB." },
        { status: 400 }
      );
    }

    originalFileName = file.name;
    fileSize = file.size;
    storagePath = `${user.id}/${documentType}/${timestamp}_${file.name}`;

    console.log(
      `[UPLOAD] User ${user.id.substring(0, 8)}...: ${documentType}, file="${file.name}", size=${file.size}`
    );

    pdfBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("documents")
      .upload(storagePath, pdfBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(`[UPLOAD] Storage upload FAILED:`, uploadError);
      return Response.json(
        { error: "Failed to upload file." },
        { status: 500 }
      );
    }
  }

  // 3. Insert document record
  const { data: doc, error: insertError } = await supabase
    .from("uploaded_documents")
    .insert({
      user_id: user.id,
      document_type: documentType,
      file_name: originalFileName,
      storage_path: storagePath,
      file_size: fileSize,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    console.error("[UPLOAD] Document insert error:", insertError);
    return Response.json(
      { error: "Failed to create document record." },
      { status: 500 }
    );
  }

  const docId = doc.id;

  // 4. Parse document
  console.log(
    `[UPLOAD] Starting parse for ${documentType}, docId=${docId}, mode=${base64Images ? "images" : "pdf"}`
  );
  try {
    let parsedData: Record<string, unknown> = {};
    let state = await loadConversationState(user.id);

    // Parse using either pre-decoded images or raw PDF
    switch (documentType) {
      case "bank_statement": {
        const parsed = await parseBankStatement(pdfBuffer, base64Images);
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
        const parsed = await parseMFStatement(pdfBuffer, base64Images);
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
        const parsed = await parseDematStatement(pdfBuffer, base64Images);
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

    // Update document as parsed
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

    console.log(
      `[UPLOAD] Parse SUCCESS for ${documentType}, docId=${docId}`
    );

    return Response.json({
      documentId: docId,
      status: "parsed",
      parsedData,
      summary,
    });
  } catch (error) {
    console.error(
      `[UPLOAD] Parse FAILED for ${documentType}, docId=${docId}:`,
      error
    );

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
