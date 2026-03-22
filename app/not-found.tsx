import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col h-dvh bg-[#F7F7FA] items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-bold text-[#1A1A2E] mb-2">404</h1>
        <p className="text-lg text-[#6B7280] mb-6">Page not found</p>
        <Link
          href="/chat"
          className="inline-block py-2.5 px-6 rounded-lg bg-[#0F3460] text-white text-sm font-medium hover:bg-[#0c2a4e] transition"
        >
          Go to chat
        </Link>
      </div>
    </div>
  );
}
