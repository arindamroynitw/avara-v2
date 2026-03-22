/**
 * Check if a PDF buffer is password-protected.
 * Uses a simple heuristic: look for /Encrypt in the PDF header.
 * This avoids needing pdfjs-dist or canvas in serverless environments.
 */
export async function isPdfEncrypted(pdfBuffer: Buffer): Promise<boolean> {
  // PDF encryption is indicated by an /Encrypt entry in the trailer/xref
  const pdfString = pdfBuffer.toString("latin1");
  return pdfString.includes("/Encrypt");
}

/**
 * @deprecated No longer needed — we send PDFs directly to GPT-4o.
 * Kept for API compatibility but should not be called.
 */
export async function convertPdfToImages(
  _pdfBuffer: Buffer
): Promise<string[]> {
  throw new Error(
    "convertPdfToImages is deprecated. Use direct PDF file input with GPT-4o instead."
  );
}
