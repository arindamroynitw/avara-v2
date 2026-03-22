import { RiaAvatar } from "./RiaAvatar";

interface TextMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function TextMessage({ role, content }: TextMessageProps) {
  if (role === "assistant") {
    return (
      <div className="flex items-start gap-2.5 max-w-[90%]">
        <RiaAvatar size={32} />
        <div className="bg-white rounded-2xl rounded-tl-md shadow-sm border border-gray-100 px-4 py-3">
          <p className="text-sm text-[#1A1A2E] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="bg-[#0F3460] rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]">
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
