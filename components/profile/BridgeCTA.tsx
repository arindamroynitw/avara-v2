"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface BridgeCTAProps {
  onboardingStatus?: string;
}

export function BridgeCTA({ onboardingStatus }: BridgeCTAProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">(
    onboardingStatus === "completed" ? "done" : "idle"
  );

  async function handleClick() {
    setStatus("loading");
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingStatus: "completed" }),
      });
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <div className="text-2xl mb-2">🎯</div>
        <h3 className="font-semibold text-[#1A1A2E] mb-1">
          Your financial plan is being prepared
        </h3>
        <p className="text-sm text-[#6B7280]">
          We&apos;ll notify you when it&apos;s ready.
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className="w-full bg-[#E94560] text-white rounded-xl p-4 flex items-center justify-between hover:bg-[#d63d56] transition cursor-pointer shadow-sm disabled:opacity-70"
    >
      <div className="text-left">
        <h3 className="font-semibold text-sm">Ready for your financial plan</h3>
        <p className="text-xs text-white/80 mt-0.5">
          Get personalized recommendations based on everything you&apos;ve
          shared
        </p>
      </div>
      {status === "loading" ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <ArrowRight size={20} />
      )}
    </button>
  );
}
