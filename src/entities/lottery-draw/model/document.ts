import { ObjectId } from "mongodb";
import { z } from "zod";

const LottoNumberSchema = z.number().int().min(1).max(45);

export const LottoNumbersSchema = z
  .tuple([
    LottoNumberSchema,
    LottoNumberSchema,
    LottoNumberSchema,
    LottoNumberSchema,
    LottoNumberSchema,
    LottoNumberSchema,
  ])
  .refine((numbers) => new Set(numbers).size === 6, {
    message: "Lottery numbers must be unique",
  });

const DrawPrizeSchema = z.object({
  rank: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  winnerCount: z.number().int().nonnegative(),
  amountPerWinner: z.number().int().nonnegative(),
});

const LotteryDrawRecordBaseSchema = z.object({
  roundNumber: z.number().int().positive(),
  drawDate: z.date(),
  numbers: LottoNumbersSchema,
  bonusNumber: LottoNumberSchema,
  prizesByRank: z.array(DrawPrizeSchema),
});

const validateDraw = (
  draw: {
    numbers: readonly number[];
    bonusNumber: number;
    prizesByRank: Array<{ rank: number }>;
  },
  context: z.RefinementCtx,
) => {
  if (draw.numbers.includes(draw.bonusNumber)) {
    context.addIssue({
      code: "custom",
      message: "Bonus number must not match a winning number",
      path: ["bonusNumber"],
    });
  }
  if (
    new Set(draw.prizesByRank.map(({ rank }) => rank)).size !==
    draw.prizesByRank.length
  ) {
    context.addIssue({
      code: "custom",
      message: "Prize ranks must be unique",
      path: ["prizesByRank"],
    });
  }
};

export const LotteryDrawRecordSchema =
  LotteryDrawRecordBaseSchema.superRefine(validateDraw);

export const LotteryDrawDocumentSchema = LotteryDrawRecordBaseSchema.extend({
  _id: z.instanceof(ObjectId),
}).superRefine(validateDraw);

export const LotteryDrawAnalysisRowSchema = z.object({
  roundNumber: z.number().int().positive(),
  numbers: LottoNumbersSchema,
});

export type LotteryDrawDocument = z.infer<typeof LotteryDrawDocumentSchema>;
export type LotteryDrawRecord = z.infer<typeof LotteryDrawRecordSchema>;
export type LotteryDrawAnalysisRow = z.infer<
  typeof LotteryDrawAnalysisRowSchema
>;
