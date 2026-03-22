import { z } from "zod";

export const quickReplySchema = z.object({
  options: z.array(z.string()),
});

export const uploadCardSchema = z.object({
  documentType: z.string(),
  rationale: z.string(),
  howToGet: z.string(),
  dataReassurance: z.string(),
});

export const progressNudgeSchema = z.object({
  sections: z.array(
    z.object({
      name: z.string(),
      total: z.number(),
      collected: z.number(),
    })
  ),
  currentChapter: z.number(),
});

export const documentStatusSchema = z.object({
  documentType: z.string(),
  status: z.enum(["processing", "parsed", "failed"]),
  message: z.string(),
});

export const insightCardSchema = z.object({
  headline: z.string(),
  keyNumber: z.string().optional(),
  explanation: z.string(),
  chartType: z.enum(["donut", "bar", "comparison"]).optional(),
  chartData: z.record(z.string(), z.number()).optional(),
  isDemographic: z.boolean(),
});

export const voiceSummarySchema = z.object({
  durationSeconds: z.number(),
  coveredTopics: z.array(z.string()),
  fullSummary: z.string(),
});

export const voiceSuggestionSchema = z.object({
  message: z.string(),
});

export const dataPartSchemas = {
  quick_reply: quickReplySchema,
  upload_card: uploadCardSchema,
  progress_nudge: progressNudgeSchema,
  document_status: documentStatusSchema,
  insight_card: insightCardSchema,
  voice_summary: voiceSummarySchema,
  voice_suggestion: voiceSuggestionSchema,
};

// Infer types from schemas
export type QuickReplyPart = z.infer<typeof quickReplySchema>;
export type UploadCardPart = z.infer<typeof uploadCardSchema>;
export type ProgressNudgePart = z.infer<typeof progressNudgeSchema>;
export type DocumentStatusPart = z.infer<typeof documentStatusSchema>;
export type VoiceSummaryPart = z.infer<typeof voiceSummarySchema>;
export type VoiceSuggestionPart = z.infer<typeof voiceSuggestionSchema>;
