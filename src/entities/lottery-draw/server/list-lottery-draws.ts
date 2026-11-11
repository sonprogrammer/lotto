import { getMongoDb } from "@/shared/server/mongodb/client";
import {
  LotteryDrawAnalysisRowSchema,
  type LotteryDrawDocument,
  LotteryDrawRecordSchema,
  type LotteryDrawRecord,
} from "../model/document";
import type { LotteryDraw } from "../model/types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function listLotteryDraws(): Promise<LotteryDraw[]> {
  const rows = await (
    await getMongoDb()
  )
    .collection<LotteryDrawDocument>("lottery_draws")
    .find({}, { projection: { _id: 0, roundNumber: 1, numbers: 1 } })
    .sort({ roundNumber: 1 })
    .toArray();
  return rows.map((row) => LotteryDrawAnalysisRowSchema.parse(row));
}

export async function listLotteryDrawsPage({
  beforeRound,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  beforeRound?: number;
  pageSize?: number;
} = {}): Promise<{ draws: LotteryDrawRecord[]; nextCursor: number | null }> {
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const query = beforeRound ? { roundNumber: { $lt: beforeRound } } : {};
  const rows = await (
    await getMongoDb()
  )
    .collection<LotteryDrawRecord>("lottery_draws")
    .find(query, {
      projection: {
        _id: 0,
        roundNumber: 1,
        drawDate: 1,
        numbers: 1,
        bonusNumber: 1,
        prizesByRank: 1,
      },
    })
    .sort({ roundNumber: -1 })
    .limit(safePageSize + 1)
    .toArray();
  const hasNextPage = rows.length > safePageSize;
  const draws = rows
    .slice(0, safePageSize)
    .map((row) => LotteryDrawRecordSchema.parse(row));

  return {
    draws,
    nextCursor: hasNextPage ? (draws.at(-1)?.roundNumber ?? null) : null,
  };
}
