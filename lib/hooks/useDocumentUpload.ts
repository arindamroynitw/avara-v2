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
   * Upload a raw file (non-PDF or unprotected PDF)
   */
  const uploadDocument = useCallback(
    async (
      file: File,
      documentType: string
    ): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", documentType);

        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
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

  /**
   * Upload pre-decoded PNG page images (from client-side PDF decryption).
   * Sends images as a multi-file FormData — server receives clean images,
   * never sees the encrypted PDF.
   */
  const uploadImages = useCallback(
    async (
      images: Blob[],
      documentType: string,
      fileName: string
    ): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("documentType", documentType);
        formData.append("fileName", fileName);
        formData.append("inputType", "images");

        images.forEach((blob, i) => {
          formData.append(
            "images",
            new File([blob], `page_${i + 1}.png`, { type: "image/png" })
          );
        });

        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
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

  return { uploadDocument, uploadImages, isUploading, error };
}
