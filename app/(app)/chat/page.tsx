"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { UIMessage } from "ai";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { VoiceCallOverlay } from "@/components/chat/VoiceCallOverlay";
import { dataPartSchemas } from "@/lib/types/chat-ui";
import { useDocumentUpload } from "@/lib/hooks/useDocumentUpload";

export default function ChatPage() {
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  // Load message history on mount
  useEffect(() => {
    fetch("/api/chat/history")
      .then((res) => res.json())
      .then((history: UIMessage[]) => {
        setInitialMessages(history);
        setHistoryLoaded(true);
      })
      .catch(() => {
        setHistoryLoaded(true);
      });
  }, []);

  if (!historyLoaded) {
    return (
      <div className="flex flex-col h-dvh bg-[#F7F7FA] items-center justify-center">
        <div className="flex items-center gap-2 text-[#6B7280]">
          <div className="w-2 h-2 rounded-full bg-[#E94560] animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-[#E94560] animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-[#E94560] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return <ChatView initialMessages={initialMessages} />;
}

function ChatView({ initialMessages }: { initialMessages: UIMessage[] }) {
  const { messages, sendMessage, status, setMessages } = useChat({
    dataPartSchemas,
    messages: initialMessages.length > 0 ? initialMessages : undefined,
  });

  const [input, setInput] = useState("");
  const { uploadDocument, isUploading } = useDocumentUpload();
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  // ── Voice State ──
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceConversationId, setVoiceConversationId] = useState<string | null>(
    null
  );
  const [voiceElapsed, setVoiceElapsed] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState("disconnected");
  const [voiceIsSpeaking, setVoiceIsSpeaking] = useState(false);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationRef = useRef<ReturnType<
    typeof import("@elevenlabs/react").useConversation
  > | null>(null);

  // TEMPORARILY DISABLED: Voice mode unavailable (ElevenLabs credits exhausted)
  // Re-enable when credits are restored:
  // const voiceEnabled = !!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const voiceEnabled = false;

  // B6: Clean up voice timer on unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
        voiceTimerRef.current = null;
      }
    };
  }, []);

  // Start voice call
  const handleStartVoiceCall = useCallback(
    async (triggerContext?: string) => {
      try {
        // Request mic permission
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Get token from server
        const res = await fetch("/api/voice/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ triggerContext }),
        });
        const { signedUrl, sessionId } = await res.json();

        if (!signedUrl) throw new Error("No signed URL received");

        setVoiceSessionId(sessionId);
        setVoiceOverlayOpen(true);
        setVoiceElapsed(0);
        setVoiceStatus("connecting");

        // Use the Conversation class from @elevenlabs/client (not the React hook)
        const { Conversation } = await import("@elevenlabs/client");

        const conversation = await Conversation.startSession({
          signedUrl,
          onConnect: ({ conversationId: convId }) => {
            setVoiceConversationId(convId);
            setVoiceStatus("connected");
            // Start elapsed timer
            voiceTimerRef.current = setInterval(() => {
              setVoiceElapsed((prev) => prev + 1);
            }, 1000);
          },
          onDisconnect: () => {
            setVoiceStatus("disconnected");
            if (voiceTimerRef.current) {
              clearInterval(voiceTimerRef.current);
              voiceTimerRef.current = null;
            }
          },
          onError: (error) => {
            console.error("Voice error:", error);
            setVoiceStatus("error");
            if (voiceTimerRef.current) {
              clearInterval(voiceTimerRef.current);
              voiceTimerRef.current = null;
            }
          },
          onModeChange: ({ mode }) => {
            setVoiceIsSpeaking(mode === "speaking");
          },
        });

        conversationRef.current = conversation as any;
      } catch (err) {
        console.error("Failed to start voice call:", err);
        setVoiceOverlayOpen(false);
        setVoiceStatus("disconnected");
      }
    },
    []
  );

  // End voice call
  const handleEndVoiceCall = useCallback(async () => {
    // Stop the conversation
    if (conversationRef.current) {
      await (conversationRef.current as any).endSession();
      conversationRef.current = null;
    }

    // Stop timer
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }

    setVoiceOverlayOpen(false);
    const duration = voiceElapsed;

    // Process the voice session on the server
    if (voiceSessionId && voiceConversationId) {
      try {
        const res = await fetch("/api/voice/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: voiceSessionId,
            conversationId: voiceConversationId,
            durationSeconds: duration,
          }),
        });

        if (res.ok) {
          // Send a trigger so Ria acknowledges the voice call in chat
          sendMessage({
            text: `[VOICE_ENDED:${voiceSessionId}]`,
          });
        }
      } catch (err) {
        console.error("Failed to process voice session:", err);
      }
    }

    setVoiceSessionId(null);
    setVoiceConversationId(null);
    setVoiceElapsed(0);
    setVoiceStatus("disconnected");
    setVoiceIsSpeaking(false);
  }, [voiceElapsed, voiceSessionId, voiceConversationId, sendMessage]);

  // Handle document upload from UploadCard or ChatInput attachment
  const handleUpload = useCallback(
    async (file: File, documentType: string) => {
      setUploadingDocType(documentType);
      const result = await uploadDocument(file, documentType);
      setUploadingDocType(null);
      if (result && result.status === "parsed") {
        sendMessage({
          text: `[DOCUMENT_PARSED:${documentType}:${result.documentId}]`,
        });
      } else if (result && result.status === "failed") {
        sendMessage({
          text: `[DOCUMENT_FAILED:${documentType}]`,
        });
      }
    },
    [uploadDocument, sendMessage]
  );

  // Handle file from ChatInput paperclip
  const handleFileUpload = useCallback(
    (file: File) => {
      handleUpload(file, "bank_statement");
    },
    [handleUpload]
  );

  // Trigger Ria's opening message on first load (no history)
  const initialized = useRef(false);
  useEffect(() => {
    if (
      !initialized.current &&
      initialMessages.length === 0 &&
      messages.length === 0
    ) {
      initialized.current = true;
      sendMessage({ text: "[SESSION_START]" });
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || status !== "ready") return;
      sendMessage({ text: input.trim() });
      setInput("");
    },
    [input, status, sendMessage]
  );

  const handleQuickReplySelect = useCallback(
    (option: string) => {
      if (status !== "ready") return;
      sendMessage({ text: option });
    },
    [status, sendMessage]
  );

  // Filter out hidden trigger messages from display
  const displayMessages = messages.filter((m) => {
    if (m.role === "user") {
      const text = m.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("");
      return (
        text !== "[SESSION_START]" &&
        !text?.startsWith("[DOCUMENT_PARSED:") &&
        !text?.startsWith("[DOCUMENT_FAILED:") &&
        !text?.startsWith("[VOICE_ENDED:")
      );
    }
    return true;
  });

  const isLoading =
    status === "submitted" || status === "streaming" || isUploading;

  return (
    <div className="flex flex-col h-dvh bg-[#F7F7FA]">
      <ChatHeader
        onVoiceCall={() => handleStartVoiceCall("header_button")}
        voiceEnabled={voiceEnabled}
      />
      <MessageList
        messages={displayMessages}
        isLoading={isLoading}
        onQuickReplySelect={handleQuickReplySelect}
        onUpload={handleUpload}
        onStartVoiceCall={() => handleStartVoiceCall("suggestion_card")}
        uploadingDocType={uploadingDocType}
      />
      <ChatInput
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
      />

      {/* Voice call overlay */}
      {voiceOverlayOpen && (
        <VoiceCallOverlay
          onEndCall={handleEndVoiceCall}
          status={voiceStatus}
          isSpeaking={voiceIsSpeaking}
          elapsedSeconds={voiceElapsed}
        />
      )}
    </div>
  );
}
