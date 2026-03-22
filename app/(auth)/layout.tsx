export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F7F7FA] px-4">
      <div className="w-full max-w-[400px]">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
            Avara
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Your AI Financial Advisor
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {children}
        </div>

        {/* Trust badge */}
        <p className="text-center text-xs text-[#6B7280] mt-6">
          SEBI Registered Investment Advisor &middot; Confidential
        </p>
      </div>
    </div>
  );
}
