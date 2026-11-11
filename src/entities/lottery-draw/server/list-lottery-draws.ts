import { getMongoDb } from "@/shared/server/mongodb/client";
import type { LotteryDraw } from "../model/types";

export async function listLotteryDraws(): Promise<LotteryDraw[]> {
  return (await getMongoDb())
    .collection<LotteryDraw>("lottery_draws")
    .find({}, { projection: { _id: 0, roundNumber: 1, numbers: 1 } })
    .sort({ roundNumber: 1 })
    .toArray();
}
