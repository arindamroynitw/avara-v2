"use client";

import { useState, useCallback } from "react";

// pdfjs-dist loaded dynamically to keep bundle small
let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function loadPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist");
  // Set worker source from CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

export type PdfStatus =
  | "idle"
  | "loading"
  | "needs_password"
  | "decrypting"
  | "rendering"
  | "ready"
  | "error";

interface PdfProcessorResult {
  status: PdfStatus;
  error: string | null;
  pageCount: number;
  /** Process a PDF file — returns PNG blobs if successful, or null if password needed */
  processFile: (file: File) => Promise<Blob[] | "needs_password">;
  /** Retry with password after needs_password */
  processWithPassword: (password: string) => Promise<Blob[]>;
  /** Reset state */
  reset: () => void;
}

const RENDER_DPI = 150;
const MAX_PAGES = 10;

export function usePdfProcessor(): PdfProcessorResult {
  const [status, setStatus] = useState<PdfStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  // Store the file buffer for retry with password
  const [pendingBuffer, setPendingBuffer] = useState<ArrayBuffer | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPageCount(0);
    setPendingBuffer(null);
  }, []);

  /**
   * Render a loaded PDF document to PNG blobs
   */
  async function renderPages(
    doc: import("pdfjs-dist").PDFDocumentProxy
  ): Promise<Blob[]> {
    setStatus("rendering");
    const numPages = Math.min(doc.numPages, MAX_PAGES);
    setPageCount(numPages);

    const blobs: Blob[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({
        scale: RENDER_DPI / 72, // PDF default is 72 DPI
      });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, canvas, viewport } as Parameters<typeof page.render>[0]).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
          "image/png"
        );
      });

      blobs.push(blob);

      // Clean up
      canvas.remove();
    }

    setStatus("ready");
    return blobs;
  }

  /**
   * Try to load and render a PDF. Returns PNG blobs or "needs_password".
   */
  const processFile = useCallback(
    async (file: File): Promise<Blob[] | "needs_password"> => {
      setStatus("loading");
      setError(null);

      try {
        const pdfjs = await loadPdfjs();
        const buffer = await file.arrayBuffer();
        setPendingBuffer(buffer);

        try {
          const doc = await pdfjs.getDocument({
            data: new Uint8Array(buffer),
          }).promise;

          return await renderPages(doc);
        } catch (err: unknown) {
          // Check if it's a password error
          const error = err as { name?: string; code?: number };
          if (
            error.name === "PasswordException" ||
            error.code === 1 || // PasswordResponses.NEED_PASSWORD
            (err instanceof Error &&
              err.message.toLowerCase().includes("password"))
          ) {
            setStatus("needs_password");
            return "needs_password";
          }
          throw err;
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to process PDF";
        setError(msg);
        setStatus("error");
        throw new Error(msg);
      }
    },
    []
  );

  /**
   * Retry loading with a password
   */
  const processWithPassword = useCallback(
    async (password: string): Promise<Blob[]> => {
      if (!pendingBuffer) {
        throw new Error("No pending PDF to decrypt");
      }

      setStatus("decrypting");
      setError(null);

      try {
        const pdfjs = await loadPdfjs();

        const doc = await pdfjs.getDocument({
          data: new Uint8Array(pendingBuffer),
          password,
        }).promise;

        return await renderPages(doc);
      } catch (err: unknown) {
        const error = err as { name?: string; code?: number };
        if (
          error.name === "PasswordException" ||
          error.code === 2 // PasswordResponses.INCORRECT_PASSWORD
        ) {
          setError("Incorrect password. Please try again.");
          setStatus("needs_password");
          throw new Error("Incorrect password");
        }
        const msg =
          err instanceof Error ? err.message : "Failed to decrypt PDF";
        setError(msg);
        setStatus("error");
        throw new Error(msg);
      }
    },
    [pendingBuffer]
  );

  return {
    status,
    error,
    pageCount,
    processFile,
    processWithPassword,
    reset,
  };
}
