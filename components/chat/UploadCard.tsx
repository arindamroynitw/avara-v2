"use client";

import { useState, useRef } from "react";
import {
  Upload,
  ChevronDown,
  ChevronUp,
  Shield,
  Loader2,
} from "lucide-react";

interface UploadCardProps {
  documentType: string;
  rationale: string;
  howToGet: string;
  dataReassurance: string;
  onUpload?: (file: File, documentType: string) => Promise<void>;
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
  onUpload,
  uploadStatus = "idle",
}: UploadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const label = DOC_TYPE_LABELS[documentType] || documentType;

  const isUploading = uploadStatus === "uploading";
  const isUploaded = uploadStatus === "success";

  function handleUploadClick() {
    if (!isUploading && !isUploaded) {
      fileInputRef.current?.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    await onUpload(file, documentType);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="ml-10 my-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-[85%]">
      {/* Coral accent bar */}
      <div className="h-1 bg-[#E94560]" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Upload size={18} className="text-[#0F3460]" />
          <h4 className="font-semibold text-sm text-[#1A1A2E]">{label}</h4>
        </div>

        {/* Rationale */}
        <p className="text-sm text-[#6B7280] mb-3">{rationale}</p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload button */}
        <button
          onClick={handleUploadClick}
          disabled={isUploading || isUploaded || !onUpload}
          className={`w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition ${
            isUploaded
              ? "bg-[#059669] cursor-default"
              : isUploading
                ? "bg-[#0F3460] opacity-70 cursor-wait"
                : !onUpload
                  ? "bg-[#0F3460] opacity-60 cursor-not-allowed"
                  : "bg-[#0F3460] hover:bg-[#0c2a4e] cursor-pointer"
          }`}
        >
          {isUploading ? (
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

        {/* How to get this — collapsible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-xs text-[#0F3460] hover:underline cursor-pointer"
        >
          How to get this
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="text-xs text-[#6B7280] mt-1.5 leading-relaxed space-y-2">
            <p>{howToGet}</p>
            <p className="text-[#E94560] font-medium">
              Password-protected? Please remove the password before uploading.
              Most bank statement passwords are: first 3 letters of your name
              (CAPS) + date of birth (DDMMYYYY).
            </p>
          </div>
        )}

        {/* Data safety */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
          <Shield size={12} className="text-[#059669] flex-shrink-0" />
          <p className="text-[10px] text-[#6B7280]">{dataReassurance}</p>
        </div>
      </div>
    </div>
  );
}
