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

export const LotteryDrawDocumentSchema = z
  .object({
    _id: z.instanceof(ObjectId),
    roundNumber: z.number().int().positive(),
    numbers: LottoNumbersSchema,
    bonusNumber: LottoNumberSchema,
    prizesByRank: z.array(DrawPrizeSchema),
  })
  .refine((draw) => !draw.numbers.includes(draw.bonusNumber), {
    message: "Bonus number must not match a winning number",
    path: ["bonusNumber"],
  })
  .refine(
    (draw) =>
      new Set(draw.prizesByRank.map(({ rank }) => rank)).size ===
      draw.prizesByRank.length,
    {
      message: "Prize ranks must be unique",
      path: ["prizesByRank"],
    },
  );

export const LotteryDrawAnalysisRowSchema = z.object({
  roundNumber: z.number().int().positive(),
  numbers: LottoNumbersSchema,
});

export type LotteryDrawDocument = z.infer<typeof LotteryDrawDocumentSchema>;
export type LotteryDrawAnalysisRow = z.infer<
  typeof LotteryDrawAnalysisRowSchema
>;
