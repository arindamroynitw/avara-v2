"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";

interface EditableFieldProps {
  label: string;
  value: string | number | boolean | null | undefined;
  field: string;
  type?: "text" | "number" | "boolean";
  prefix?: string; // e.g., "₹"
  suffix?: string; // e.g., "/month"
  onSave: (field: string, value: unknown) => Promise<void>;
}

export function EditableField({
  label,
  value,
  field,
  type = "text",
  prefix,
  suffix,
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ""));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const displayValue =
    value === null || value === undefined
      ? "—"
      : type === "boolean"
        ? value
          ? "Yes"
          : "No"
        : type === "number"
          ? `${prefix || ""}${Number(value).toLocaleString("en-IN")}${suffix || ""}`
          : String(value);

  async function handleSave() {
    setSaving(true);
    try {
      const parsed =
        type === "number"
          ? Number(editValue)
          : type === "boolean"
            ? editValue === "true" || editValue === "yes"
            : editValue;
      await onSave(field, parsed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditValue(String(value ?? ""));
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-xs text-[#6B7280] w-28 flex-shrink-0">
          {label}
        </span>
        <input
          ref={inputRef}
          type={type === "number" ? "number" : "text"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded text-[#059669] hover:bg-green-50 cursor-pointer"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded text-[#9CA3AF] hover:bg-gray-50 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <span className="text-xs text-[#6B7280] w-28 flex-shrink-0">
        {label}
      </span>
      <span className="flex-1 text-sm text-[#1A1A2E]">{displayValue}</span>
      <button
        onClick={() => {
          setEditValue(String(value ?? ""));
          setEditing(true);
        }}
        className="p-1 rounded text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition cursor-pointer"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}
