"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { MessageRenderer } from "./MessageRenderer";
import { TypingIndicator } from "./TypingIndicator";
import { MessageErrorBoundary } from "./ChatError";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  onQuickReplySelect: (option: string) => void;
  onUpload?: (file: File, documentType: string) => Promise<void>;
  onUploadImages?: (images: Blob[], documentType: string, fileName: string) => Promise<void>;
  onStartVoiceCall?: () => void;
  uploadingDocType?: string | null;
}

export function MessageList({
  messages,
  isLoading,
  onQuickReplySelect,
  onUpload,
  onUploadImages,
  onStartVoiceCall,
  uploadingDocType,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((message) => {
        if (message.role === "user" || message.role === "assistant") {
          return (
            <MessageErrorBoundary key={message.id}>
              <MessageRenderer
                message={message}
                onQuickReplySelect={onQuickReplySelect}
                onUpload={onUpload}
                onUploadImages={onUploadImages}
                onStartVoiceCall={onStartVoiceCall}
                uploadingDocType={uploadingDocType}
              />
            </MessageErrorBoundary>
          );
        }
        return null;
      })}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
