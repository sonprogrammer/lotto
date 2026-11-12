import { z } from "zod";

export const AnalysisPeriodSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({
    type: z.literal("recent"),
    count: z.number().int().positive(),
  }),
]);

export type AnalysisPeriod = z.infer<typeof AnalysisPeriodSchema>;

export type AnalysisPeriodSummary = {
  type: AnalysisPeriod["type"];
  count: number | null;
  drawCount: number;
  firstRound: number | null;
  latestRound: number | null;
};
