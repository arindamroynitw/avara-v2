"use client";

import { useState, useCallback } from "react";

interface UploadResult {
  documentId: string;
  status: "parsed" | "failed";
  parsedData?: Record<string, unknown>;
  summary?: string;
  error?: string;
  message?: string;
}

export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload extracted text for GPT parsing.
   * The PDF was already decoded client-side — we only send the text.
   */
  const uploadText = useCallback(
    async (
      text: string,
      documentType: string,
      fileName: string
    ): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, documentType, fileName }),
        });

        const result: UploadResult = await res.json();

        if (!res.ok) {
          setError(result.message || "Upload failed");
          return null;
        }

        return result;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Upload failed unexpectedly";
        setError(msg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { uploadText, isUploading, error };
}
