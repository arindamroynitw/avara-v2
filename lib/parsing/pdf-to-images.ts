import { createCanvas } from "canvas";

/**
 * Convert a PDF buffer to an array of base64 PNG data URIs.
 * Uses pdfjs-dist legacy build (Node.js compatible) + canvas.
 * Caps at 10 pages, renders at 150 DPI (2x scale).
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer
): Promise<string[]> {
  // Dynamic import for ESM module
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const data = new Uint8Array(pdfBuffer);
  const doc = await pdfjsLib.getDocument({ data }).promise;

  const pageCount = Math.min(doc.numPages, 10);
  const images: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const scale = 2.0; // ~150 DPI
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (page.render as any)({
      canvasContext: context as any,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer("image/png");
    const base64 = pngBuffer.toString("base64");
    images.push(`data:image/png;base64,${base64}`);
  }

  return images;
}

/**
 * Check if a PDF buffer is password-protected.
 * Returns true if the PDF requires a password to open.
 */
export async function isPdfEncrypted(pdfBuffer: Buffer): Promise<boolean> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(pdfBuffer);

  try {
    await pdfjsLib.getDocument({ data }).promise;
    return false;
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "PasswordException") {
      return true;
    }
    throw err;
  }
}
