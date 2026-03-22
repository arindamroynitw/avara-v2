"use client";

import { useState } from "react";

interface QuickReplyMessageProps {
  options: string[];
  onSelect: (option: string) => void;
}

export function QuickReplyMessage({
  options,
  onSelect,
}: QuickReplyMessageProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    onSelect(option);
  }

  if (selected) return null;

  return (
    <div className="flex flex-wrap gap-2 pl-10 mt-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => handleSelect(option)}
          className="px-4 py-2 rounded-full border border-[#0F3460] text-[#0F3460] bg-white text-sm hover:bg-[#0F3460] hover:text-white transition-colors cursor-pointer"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
