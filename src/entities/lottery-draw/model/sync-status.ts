import { z } from "zod";

export const LOTTERY_SYNC_STATUS_DOCUMENT_ID = "lottery-draw-sync";

export const LotterySyncStatusSchema = z.object({
  lastAttemptAt: z.date().nullable(),
  lastSuccessAt: z.date().nullable(),
  state: z.enum(["idle", "running", "success", "failed"]),
  latestRound: z.number().int().positive().nullable(),
  errorSummary: z.string().max(100).nullable(),
});

export const LotterySyncStatusDocumentSchema = LotterySyncStatusSchema.extend({
  _id: z.literal(LOTTERY_SYNC_STATUS_DOCUMENT_ID),
  runId: z.string().min(1),
});

export type LotterySyncState = "idle" | "running" | "success" | "failed";
export type LotterySyncStatus = z.infer<typeof LotterySyncStatusSchema>;
export type LotterySyncStatusDocument = z.infer<
  typeof LotterySyncStatusDocumentSchema
>;
