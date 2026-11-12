import { z } from "zod";
import { AnalysisPeriodSchema } from "@/features/analysis/model/analysis-period";

const LotteryNumberSchema = z.number().int().min(1).max(45);

export const GenerationRequestSchema = z
  .object({
    method: z.enum(["automatic", "selected", "ai-assisted"]),
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
    if (request.method === "automatic" && fixedNumbers.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["fixedNumbers"],
        message: "Automatic generation does not accept fixed numbers",
      });
    }
    if (request.method === "selected" && fixedNumbers.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["fixedNumbers"],
        message: "Selected generation requires fixed numbers",
      });
    }
    if (
      request.method === "ai-assisted" &&
      (fixedNumbers.length < 1 || fixedNumbers.length > 5)
    ) {
      context.addIssue({
        code: "custom",
        path: ["fixedNumbers"],
        message: "AI-assisted generation requires one to five fixed numbers",
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
