import { ObjectId } from "mongodb";
import { z } from "zod";
import { LottoNumbersSchema } from "@/entities/lottery-draw/model/document";

const SavedCombinationNumberVersionSchema = z
  .object({
    numbers: LottoNumbersSchema,
    fromRound: z.number().int().positive(),
    throughRound: z.number().int().positive(),
  })
  .refine(({ fromRound, throughRound }) => throughRound >= fromRound, {
    message: "Version end round must not precede its start round",
    path: ["throughRound"],
  });

const SavedCombinationDrawResultSchema = z.object({
  roundNumber: z.number().int().positive(),
  drawDate: z.date(),
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
});

const SavedCombinationBaseSchema = z.object({
  _id: z.instanceof(ObjectId),
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  numbers: LottoNumbersSchema,
  trackingStartRound: z.number().int().positive(),
  numberVersions: z.array(SavedCombinationNumberVersionSchema),
  drawResults: z.array(SavedCombinationDrawResultSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SavedCombinationDocumentSchema = z
  .discriminatedUnion("source", [
    SavedCombinationBaseSchema.extend({
      source: z.literal("manual"),
      analysisSummary: z.undefined().optional(),
    }),
    SavedCombinationBaseSchema.extend({
      source: z.literal("ai-assisted"),
      analysisSummary: z.string().trim().min(1),
    }),
  ])
  .superRefine(({ drawResults }, context) => {
    const roundNumbers = drawResults.map(({ roundNumber }) => roundNumber);
    if (new Set(roundNumbers).size !== roundNumbers.length) {
      context.addIssue({
        code: "custom",
        message: "Saved combination draw results must have unique rounds",
        path: ["drawResults"],
      });
    }
  });

export type SavedCombinationDocument = z.infer<
  typeof SavedCombinationDocumentSchema
>;
