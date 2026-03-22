"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col h-dvh bg-[#F7F7FA] items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#E94560] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Don&apos;t worry — your data is safe. Let&apos;s try again.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-lg bg-[#0F3460] text-white text-sm font-medium hover:bg-[#0c2a4e] transition cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/chat"
            className="text-sm text-[#0F3460] hover:underline text-center"
          >
            Go to chat
          </a>
        </div>
      </div>
    </div>
  );
}
