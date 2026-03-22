"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mic, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface ChatHeaderProps {
  onVoiceCall?: () => void;
  voiceEnabled?: boolean;
}

export function ChatHeader({ onVoiceCall, voiceEnabled }: ChatHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  };

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
          className={`p-2 rounded-lg transition ${
            voiceEnabled
              ? "text-[#0F3460] hover:text-[#1A1A2E] hover:bg-gray-50 cursor-pointer"
              : "text-[#D1D5DB] opacity-40 cursor-not-allowed"
          }`}
          aria-label="Voice call"
          title={voiceEnabled ? "Start voice call" : "Voice calls coming soon"}
        >
          <Mic size={20} />
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#E94560] hover:bg-red-50 transition cursor-pointer"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
