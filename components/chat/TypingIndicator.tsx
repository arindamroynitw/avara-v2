import { RiaAvatar } from "./RiaAvatar";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <RiaAvatar size={32} />
      <div className="bg-white rounded-2xl rounded-tl-md shadow-sm border border-gray-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
