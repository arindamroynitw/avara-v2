export type MessageType =
  | "text"
  | "quick_reply"
  | "upload_card"
  | "insight_card"
  | "progress_nudge"
  | "voice_summary"
  | "voice_suggestion"
  | "document_status";

export interface QuickReplyData {
  options: string[];
}

export interface UploadCardData {
  documentType: string;
  rationale: string;
  howToGet: string;
  dataReassurance: string;
}

export interface InsightCardData {
  headline: string;
  keyNumber?: string;
  explanation: string;
  chartType?: "donut" | "bar" | "comparison";
  chartData?: Record<string, number>;
  isDemographic: boolean;
}

export interface VoiceSummaryData {
  durationSeconds: number;
  coveredTopics: string[];
  fullSummary: string;
}

export interface VoiceSuggestionData {
  message: string;
}

export interface DocumentStatusData {
  documentType: string;
  status: "processing" | "parsed" | "failed";
  message: string;
}

export interface ComponentInjection {
  type: MessageType;
  data: Record<string, unknown>;
  position: "after_response" | "replace_response";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  messageType: MessageType;
  metadata: Record<string, unknown>;
  chapter?: number;
  createdAt: string;
}
