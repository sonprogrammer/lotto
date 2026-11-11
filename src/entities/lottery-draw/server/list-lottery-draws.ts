import { getMongoDb } from "@/shared/server/mongodb/client";
import {
  LotteryDrawAnalysisRowSchema,
  type LotteryDrawDocument,
} from "../model/document";
import type { LotteryDraw } from "../model/types";

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
