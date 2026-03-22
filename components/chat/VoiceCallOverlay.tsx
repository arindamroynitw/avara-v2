"use client";

import { Phone, PhoneOff } from "lucide-react";
import { RiaAvatar } from "./RiaAvatar";

interface VoiceCallOverlayProps {
  onEndCall: () => void;
  status: string;
  isSpeaking: boolean;
  elapsedSeconds: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceCallOverlay({
  onEndCall,
  status,
  isSpeaking,
  elapsedSeconds,
}: VoiceCallOverlayProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A2E] flex flex-col items-center justify-between py-16 px-6 pb-[max(4rem,env(safe-area-inset-bottom))]">
      {/* Status */}
      <div className="text-center">
        <p className="text-white/60 text-sm mb-1">
          {isConnecting
            ? "Connecting..."
            : isConnected
              ? "Voice call with Ria"
              : "Call ended"}
        </p>
        {isConnected && (
          <p className="text-white/40 text-xs font-mono">
            {formatTime(elapsedSeconds)}
          </p>
        )}
      </div>

      {/* Avatar + waveform */}
      <div className="flex flex-col items-center gap-6">
        <div
          className={`transition-transform duration-300 ${isSpeaking ? "scale-110" : "scale-100"}`}
        >
          <div className="w-24 h-24 rounded-full bg-[#E94560] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#E94560]/30">
            R
          </div>
        </div>

        {/* Waveform animation */}
        {isConnected && (
          <div className="flex items-center gap-1 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? "bg-[#E94560] animate-pulse"
                    : "bg-white/30"
                }`}
                style={{
                  height: isSpeaking
                    ? `${12 + Math.random() * 20}px`
                    : "8px",
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        )}

        <p className="text-white/50 text-xs">
          {isSpeaking
            ? "Ria is speaking..."
            : isConnected
              ? "Listening..."
              : isConnecting
                ? "Setting up..."
                : ""}
        </p>
      </div>

      {/* End call button */}
      <button
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition cursor-pointer shadow-lg"
        aria-label="End call"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
}
