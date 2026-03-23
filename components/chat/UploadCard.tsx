"use client";

import { useState, useRef } from "react";
import {
  Upload,
  ChevronDown,
  ChevronUp,
  Shield,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { usePdfProcessor } from "@/lib/hooks/usePdfProcessor";

interface UploadCardProps {
  documentType: string;
  rationale: string;
  howToGet: string;
  dataReassurance: string;
  onUploadText?: (
    text: string,
    documentType: string,
    fileName: string
  ) => Promise<void>;
  uploadStatus?: "idle" | "uploading" | "success" | "error";
}

const DOC_TYPE_LABELS: Record<string, string> = {
  bank_statement: "Bank Statement",
  mf_statement: "Mutual Fund Statement",
  demat_statement: "Demat Holdings",
};

export function UploadCard({
  documentType,
  rationale,
  howToGet,
  dataReassurance,
  onUploadText,
  uploadStatus = "idle",
}: UploadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const label = DOC_TYPE_LABELS[documentType] || documentType;

  const pdf = usePdfProcessor();
  const isUploading = uploadStatus === "uploading";
  const isUploaded = uploadStatus === "success";
  const needsPassword =
    pdf.status === "needs_password" || pdf.status === "wrong_password";
  const isProcessing = pdf.status === "extracting";

  function handleUploadClick() {
    if (!isUploading && !isUploaded && !isProcessing && !needsPassword) {
      fileInputRef.current?.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUploadText) return;

    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      // Non-PDF: read as text and send directly
      const text = await file.text();
      await onUploadText(text, documentType, file.name);
      return;
    }

    // Extract text from PDF client-side
    const result = await pdf.extractText(file);
    if (result === "needs_password") return; // UI shows password field

    // Text extracted — send to server for GPT parsing
    await onUploadText(result, documentType, file.name);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || !onUploadText) return;

    try {
      const text = await pdf.extractWithPassword(password.trim());
      await onUploadText(text, documentType, fileName);
      setPassword("");
    } catch {
      // Error shown via pdf.error
    }
  }

  return (
    <div className="ml-10 my-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-[85%]">
      <div className="h-1 bg-[#E94560]" />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Upload size={18} className="text-[#0F3460]" />
          <h4 className="font-semibold text-sm text-[#1A1A2E]">{label}</h4>
        </div>

        <p className="text-sm text-[#6B7280] mb-3">{rationale}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Password input */}
        {needsPassword && (
          <form onSubmit={handlePasswordSubmit} className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-[#E94560]" />
              <span className="text-xs font-medium text-[#1A1A2E]">
                {pdf.status === "wrong_password"
                  ? "Wrong password — try again"
                  : "This PDF is password-protected"}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PDF password"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460] focus:border-transparent pr-8"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={!password.trim() || pdf.status === "extracting"}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0F3460] rounded-lg hover:bg-[#0c2a4e] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Unlock
              </button>
            </div>
            <p className="text-[10px] text-[#6B7280] mt-1.5">
              Common bank passwords: first 3 letters of name (CAPS) + DOB
              (DDMMYYYY). Decrypted locally — never sent to our servers.
            </p>
          </form>
        )}

        {/* Upload button */}
        {!needsPassword && (
          <button
            onClick={handleUploadClick}
            disabled={isUploading || isUploaded || isProcessing || !onUploadText}
            className={`w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition ${
              isUploaded
                ? "bg-[#059669] cursor-default"
                : isUploading || isProcessing
                  ? "bg-[#0F3460] opacity-70 cursor-wait"
                  : !onUploadText
                    ? "bg-[#0F3460] opacity-60 cursor-not-allowed"
                    : "bg-[#0F3460] hover:bg-[#0c2a4e] cursor-pointer"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Reading PDF...
              </>
            ) : isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : isUploaded ? (
              <>✓ Uploaded</>
            ) : (
              <>
                <Upload size={16} />
                Upload {label}
              </>
            )}
          </button>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-xs text-[#0F3460] hover:underline cursor-pointer"
        >
          How to get this
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
            {howToGet}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
          <Shield size={12} className="text-[#059669] flex-shrink-0" />
          <p className="text-[10px] text-[#6B7280]">{dataReassurance}</p>
        </div>
      </div>
    </div>
  );
}
