"use client";

import { Phone, X } from "lucide-react";

interface VoiceCallButtonProps {
  message: string;
  onStartCall: () => void;
  onDismiss: () => void;
}

export function VoiceCallButton({
  message,
  onStartCall,
  onDismiss,
}: VoiceCallButtonProps) {
  return (
    <div className="ml-10 my-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-[85%]">
      {/* Accent bar */}
      <div className="h-1 bg-[#0F3460]" />

      <div className="p-4">
        {/* Message */}
        <p className="text-sm text-[#1A1A2E] mb-3">{message}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onStartCall}
            className="flex-1 py-2.5 rounded-lg bg-[#0F3460] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#0c2a4e] transition cursor-pointer"
          >
            <Phone size={16} />
            Start Voice Call
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-[#6B7280] text-sm hover:bg-gray-50 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[10px] text-[#9CA3AF] mt-2 text-center">
          You can switch back to text at any time
        </p>
      </div>
    </div>
  );
}
