"use client";

import Link from "next/link";
import { User, Mic } from "lucide-react";

interface ChatHeaderProps {
  onVoiceCall?: () => void;
  voiceEnabled?: boolean;
}

export function ChatHeader({ onVoiceCall, voiceEnabled }: ChatHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-[#1A1A2E] tracking-tight">
          Avara
        </h1>
        <p className="text-[10px] text-[#6B7280] -mt-0.5">
          SEBI Registered IA
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-gray-50 transition cursor-pointer"
          aria-label="Profile"
        >
          <User size={20} />
        </Link>
        <button
          onClick={onVoiceCall}
          disabled={!voiceEnabled}
          className={`p-2 rounded-lg transition cursor-pointer ${
            voiceEnabled
              ? "text-[#0F3460] hover:text-[#1A1A2E] hover:bg-gray-50"
              : "text-[#9CA3AF] opacity-50 cursor-not-allowed"
          }`}
          aria-label="Voice call"
        >
          <Mic size={20} />
        </button>
      </div>
    </header>
  );
}
