"use client";

import { useRef } from "react";
import { Paperclip, ArrowUp } from "lucide-react";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileUpload?: (file: File) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  onChange,
  onSubmit,
  onFileUpload,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="bg-white border-t border-gray-100 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex-shrink-0">
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleAttachClick}
          className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-gray-50 transition flex-shrink-0 cursor-pointer"
          aria-label="Attach file"
          disabled={!onFileUpload}
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-2xl bg-[#F7F7FA] px-4 py-2.5 text-sm text-[#1A1A2E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F3460] focus:ring-offset-1 transition"
          style={{ maxHeight: 120 }}
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-9 h-9 rounded-full bg-[#E94560] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d63d56] transition cursor-pointer"
          aria-label="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}
