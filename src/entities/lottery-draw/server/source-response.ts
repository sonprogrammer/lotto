import { z } from "zod";
import {
  LotteryDrawRecordSchema,
  type LotteryDrawRecord,
} from "../model/document";

const SourceDrawSchema = z.object({
  ltEpsd: z.number().int().positive(),
  ltRflYmd: z.string().regex(/^\d{8}$/),
  tm1WnNo: z.number().int().min(1).max(45),
  tm2WnNo: z.number().int().min(1).max(45),
  tm3WnNo: z.number().int().min(1).max(45),
  tm4WnNo: z.number().int().min(1).max(45),
  tm5WnNo: z.number().int().min(1).max(45),
  tm6WnNo: z.number().int().min(1).max(45),
  bnsWnNo: z.number().int().min(1).max(45),
  rnk1WnNope: z.number().int().nonnegative(),
  rnk1WnAmt: z.number().int().nonnegative(),
  rnk2WnNope: z.number().int().nonnegative(),
  rnk2WnAmt: z.number().int().nonnegative(),
  rnk3WnNope: z.number().int().nonnegative(),
  rnk3WnAmt: z.number().int().nonnegative(),
  rnk4WnNope: z.number().int().nonnegative(),
  rnk4WnAmt: z.number().int().nonnegative(),
  rnk5WnNope: z.number().int().nonnegative(),
  rnk5WnAmt: z.number().int().nonnegative(),
});

const SourceResponseSchema = z.object({
  data: z.object({
    list: z.array(SourceDrawSchema).min(1),
  }),
});

export function parseLotteryDrawSourceResponse(
  input: unknown,
): LotteryDrawRecord[] {
  const response = SourceResponseSchema.parse(input);
  const seenRounds = new Set<number>();

  return response.data.list.map((source) => {
    if (seenRounds.has(source.ltEpsd)) {
      throw new Error("Lottery draw source contains duplicate rounds");
    }
    seenRounds.add(source.ltEpsd);

    const drawDate = parseDrawDate(source.ltRflYmd);
    return LotteryDrawRecordSchema.parse({
      roundNumber: source.ltEpsd,
      drawDate,
      numbers: [
        source.tm1WnNo,
        source.tm2WnNo,
        source.tm3WnNo,
        source.tm4WnNo,
        source.tm5WnNo,
        source.tm6WnNo,
      ],
      bonusNumber: source.bnsWnNo,
      prizesByRank: [
        {
          rank: 1,
          winnerCount: source.rnk1WnNope,
          amountPerWinner: source.rnk1WnAmt,
        },
        {
          rank: 2,
          winnerCount: source.rnk2WnNope,
          amountPerWinner: source.rnk2WnAmt,
        },
        {
          rank: 3,
          winnerCount: source.rnk3WnNope,
          amountPerWinner: source.rnk3WnAmt,
        },
        {
          rank: 4,
          winnerCount: source.rnk4WnNope,
          amountPerWinner: source.rnk4WnAmt,
        },
        {
          rank: 5,
          winnerCount: source.rnk5WnNope,
          amountPerWinner: source.rnk5WnAmt,
        },
      ],
    });
  });
}

function parseDrawDate(value: string): Date {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Lottery draw source contains an invalid draw date");
  }
  return date;
}
