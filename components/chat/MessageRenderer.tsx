"use client";

import type { UIMessage } from "ai";
import { TextMessage } from "./TextMessage";
import { QuickReplyMessage } from "./QuickReplyMessage";
import { UploadCard } from "./UploadCard";
import { ProgressNudge } from "./ProgressNudge";
import { DocumentStatus } from "./DocumentStatus";
import { InsightCard } from "./InsightCard";
import { VoiceCallButton } from "./VoiceCallButton";
import { VoiceSummary } from "./VoiceSummary";
import { RiaAvatar } from "./RiaAvatar";

interface MessageRendererProps {
  message: UIMessage;
  onQuickReplySelect: (option: string) => void;
  onUploadText?: (text: string, documentType: string, fileName: string) => Promise<void>;
  onStartVoiceCall?: () => void;
  uploadingDocType?: string | null;
}

export function MessageRenderer({
  message,
  onQuickReplySelect,
  onUploadText,
  onStartVoiceCall,
  uploadingDocType,
}: MessageRendererProps) {
  if (!message.parts || message.parts.length === 0) return null;

  // Collect text parts and data parts separately
  const textContent = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");

  const dataParts = message.parts.filter((p) =>
    p.type.startsWith("data-")
  );

  return (
    <div>
      {/* Text message */}
      {textContent && (
        <TextMessage role={message.role as "user" | "assistant"} content={textContent} />
      )}

      {/* Data parts (rich components) — only for assistant messages */}
      {message.role === "assistant" &&
        dataParts.map((part, i) => {
          const p = part as { type: string; data: Record<string, unknown> };

          switch (p.type) {
            case "data-quick_reply":
              return (
                <QuickReplyMessage
                  key={`qr-${i}`}
                  options={(p.data as { options: string[] }).options}
                  onSelect={onQuickReplySelect}
                />
              );

            case "data-upload_card":
              return (
                <UploadCard
                  key={`uc-${i}`}
                  documentType={p.data.documentType as string}
                  rationale={p.data.rationale as string}
                  howToGet={p.data.howToGet as string}
                  dataReassurance={p.data.dataReassurance as string}
                  onUploadText={onUploadText}
                  uploadStatus={
                    uploadingDocType === (p.data.documentType as string)
                      ? "uploading"
                      : "idle"
                  }
                />
              );

            case "data-progress_nudge":
              return (
                <ProgressNudge
                  key={`pn-${i}`}
                  sections={
                    p.data.sections as Array<{
                      name: string;
                      total: number;
                      collected: number;
                    }>
                  }
                  currentChapter={p.data.currentChapter as number}
                />
              );

            case "data-document_status":
              return (
                <DocumentStatus
                  key={`ds-${i}`}
                  documentType={p.data.documentType as string}
                  status={p.data.status as "processing" | "parsed" | "failed"}
                  message={p.data.message as string}
                />
              );

            case "data-insight_card":
              return (
                <InsightCard
                  key={`ic-${i}`}
                  headline={p.data.headline as string}
                  keyNumber={p.data.keyNumber as string | undefined}
                  explanation={p.data.explanation as string}
                  chartType={p.data.chartType as "donut" | "bar" | "comparison" | undefined}
                  chartData={p.data.chartData as Record<string, number> | undefined}
                  isDemographic={p.data.isDemographic as boolean}
                />
              );

            case "data-voice_suggestion":
              return (
                <VoiceCallButton
                  key={`vs-${i}`}
                  message={p.data.message as string}
                  onStartCall={onStartVoiceCall || (() => {})}
                  onDismiss={() => {}}
                />
              );

            case "data-voice_summary":
              return (
                <VoiceSummary
                  key={`vsm-${i}`}
                  durationSeconds={p.data.durationSeconds as number}
                  coveredTopics={p.data.coveredTopics as string[]}
                  fullSummary={p.data.fullSummary as string}
                />
              );

            default:
              return null;
          }
        })}
    </div>
  );
}
