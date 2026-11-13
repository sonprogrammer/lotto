import { z } from "zod";
import { LottoNumbersSchema } from "@/entities/lottery-draw/model/document";

export const SavedCombinationSourceSchema = z.enum(["manual", "ai-assisted"]);

export const SavedCombinationSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  source: SavedCombinationSourceSchema,
  numbers: LottoNumbersSchema,
  analysisSummary: z.string().optional(),
  trackingStartRound: z.number().int().positive(),
  numberVersions: z.array(
    z.object({
      numbers: LottoNumbersSchema,
      fromRound: z.number().int().positive(),
      throughRound: z.number().int().positive(),
    }),
  ),
  drawResults: z.array(
    z.object({
      roundNumber: z.number().int().positive(),
      drawDate: z.string(),
      numbersSnapshot: LottoNumbersSchema,
      matchedNumberCount: z.number().int().min(0).max(6),
      bonusMatched: z.boolean(),
      rank: z
        .union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(5),
        ])
        .nullable(),
      amountPerWinner: z.number().int().nonnegative(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedCombination = z.infer<typeof SavedCombinationSchema>;
