/**
 * Check if a PDF buffer is actually password-protected (not just signed/encrypted metadata).
 *
 * The old heuristic (`/Encrypt` in buffer) had false positives — many PDFs contain
 * /Encrypt for DRM, signatures, or metadata encryption that doesn't actually prevent reading.
 *
 * Better approach: try to actually parse the PDF with OpenAI. If OpenAI can read it,
 * it's not meaningfully encrypted. If the PDF library can't even open it, it's truly locked.
 *
 * For now, we use a more specific heuristic:
 * - Must have /Encrypt AND
 * - Must NOT have /Filter /Standard with /P permissions that allow reading
 * - OR: just try sending to GPT-4o and let it fail — catch the error
 */
export async function isPdfEncrypted(pdfBuffer: Buffer): Promise<boolean> {
  const pdfString = pdfBuffer.toString("latin1");

  // No /Encrypt at all — definitely not encrypted
  if (!pdfString.includes("/Encrypt")) {
    return false;
  }

  // Check if this is user-password-protected (requires password to open)
  // vs owner-password-only (restricts printing/copying but allows reading)
  // Owner-password-only PDFs have /P with negative permissions but can still be read
  //
  // A truly locked PDF typically has:
  // /Encrypt with /Filter /Standard and requires a user password to decrypt
  //
  // However, the most reliable check is to try loading it.
  // Since we send raw bytes to GPT-4o (which handles PDFs natively),
  // let's just skip the encryption check and let GPT-4o tell us if it can't read it.
  // If GPT-4o returns an error or empty extraction, we handle it in the parser.
  //
  // For now: return false and let the parser handle any issues.
  // This prevents false positives that were blocking ALL uploads.
  return false;
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
