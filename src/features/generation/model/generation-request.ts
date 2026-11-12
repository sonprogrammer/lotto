import { z } from "zod";
import { AnalysisPeriodSchema } from "@/features/analysis";

const LotteryNumberSchema = z.number().int().min(1).max(45);

export const GenerationRequestSchema = z
  .object({
    period: AnalysisPeriodSchema.default({ type: "recent", count: 30 }),
    fixedNumbers: z.array(LotteryNumberSchema).max(6).default([]),
    count: z.number().int().min(1).max(10).default(5),
    prompt: z.string().trim().max(500).optional(),
  })
  .superRefine((request, context) => {
    const { fixedNumbers } = request;
    if (new Set(fixedNumbers).size !== fixedNumbers.length) {
      context.addIssue({
        code: "custom",
        path: ["fixedNumbers"],
        message: "Fixed numbers must be unique",
      });
    }
    if (fixedNumbers.length === 6 && request.count !== 1) {
      context.addIssue({
        code: "custom",
        path: ["count"],
        message: "Six fixed numbers allow one combination only",
      });
    }
  });

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
