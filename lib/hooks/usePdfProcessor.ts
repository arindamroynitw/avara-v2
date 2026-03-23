"use client";

/**
 * Client-side PDF text extraction with password support.
 * Modeled on Sorted's proven implementation.
 *
 * Key insight: financial statements are structured text, not images.
 * Extract text → send to GPT-4o chat API. No vision, no canvas, no base64 images.
 */

import { useState, useCallback } from "react";

export type PdfStatus =
  | "idle"
  | "extracting"
  | "needs_password"
  | "wrong_password"
  | "ready"
  | "error";

interface PdfProcessorResult {
  status: PdfStatus;
  error: string | null;
  /** Extract text from a PDF. Returns text string, or "needs_password" */
  extractText: (file: File) => Promise<string | "needs_password">;
  /** Retry extraction with a password */
  extractWithPassword: (password: string) => Promise<string>;
  reset: () => void;
}

const MAX_PAGES = 20;

// Lazy-load pdfjs-dist
let pdfjsLoaded: typeof import("pdfjs-dist") | null = null;
async function loadPdfjs() {
  if (pdfjsLoaded) return pdfjsLoaded;
  pdfjsLoaded = await import("pdfjs-dist");
  pdfjsLoaded.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLoaded.version}/pdf.worker.min.mjs`;
  return pdfjsLoaded;
}

export function usePdfProcessor(): PdfProcessorResult {
  const [status, setStatus] = useState<PdfStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingBuffer, setPendingBuffer] = useState<ArrayBuffer | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPendingBuffer(null);
  }, []);

  async function doExtract(
    buffer: ArrayBuffer,
    password?: string
  ): Promise<string | "needs_password" | "wrong_password"> {
    const pdfjsLib = await loadPdfjs();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });

    // Handle password via onPassword callback (pdfjs-dist v5 pattern from Sorted)
    let passwordResult: "needs_password" | "wrong_password" | null = null;
    loadingTask.onPassword = (
      updatePassword: (response: unknown) => void,
      reason: number
    ) => {
      if (reason === 2) {
        // Wrong password
        passwordResult = "wrong_password";
        updatePassword(new Error("Incorrect password"));
      } else {
        // Needs password
        if (password) {
          updatePassword(password);
        } else {
          passwordResult = "needs_password";
          updatePassword(new Error("Password required"));
        }
      }
    };

    let pdf;
    try {
      pdf = await loadingTask.promise;
    } catch {
      if (passwordResult) return passwordResult;
      throw new Error("Failed to read PDF");
    }

    // Extract text from each page
    const maxPages = Math.min(pdf.numPages, MAX_PAGES);
    let fullText = "";

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  }

  const extractText = useCallback(
    async (file: File): Promise<string | "needs_password"> => {
      setStatus("extracting");
      setError(null);

      try {
        const buffer = await file.arrayBuffer();
        setPendingBuffer(buffer);

        const result = await doExtract(buffer);
        if (result === "needs_password") {
          setStatus("needs_password");
          return "needs_password";
        }
        if (result === "wrong_password") {
          setStatus("needs_password");
          return "needs_password";
        }

        setStatus("ready");
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to read PDF";
        setError(msg);
        setStatus("error");
        throw new Error(msg);
      }
    },
    []
  );

  const extractWithPassword = useCallback(
    async (password: string): Promise<string> => {
      if (!pendingBuffer) throw new Error("No pending PDF");

      setStatus("extracting");
      setError(null);

      try {
        const result = await doExtract(pendingBuffer, password);
        if (result === "wrong_password") {
          setError("Wrong password. Please try again.");
          setStatus("wrong_password");
          throw new Error("Wrong password");
        }
        if (result === "needs_password") {
          setError("Password required.");
          setStatus("needs_password");
          throw new Error("Password required");
        }

        setStatus("ready");
        return result;
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message === "Wrong password" ||
            err.message === "Password required")
        ) {
          throw err;
        }
        const msg = err instanceof Error ? err.message : "Failed to read PDF";
        setError(msg);
        setStatus("error");
        throw new Error(msg);
      }
    },
    [pendingBuffer]
  );

  return { status, error, extractText, extractWithPassword, reset };
}
