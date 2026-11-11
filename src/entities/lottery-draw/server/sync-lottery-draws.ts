import { getMongoDb } from "@/shared/server/mongodb/client";
import { parseLotteryDrawSourceResponse } from "./source-response";

const LOTTERY_SOURCE_URL =
  "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=all";

export async function syncLotteryDraws(): Promise<{
  drawCount: number;
  latestRound: number;
}> {
  const response = await fetch(LOTTERY_SOURCE_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error("Lottery draw source request failed");
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Lottery draw source returned a non-JSON response");
  }

  const draws = parseLotteryDrawSourceResponse(await response.json()).sort(
    (left, right) => left.roundNumber - right.roundNumber,
  );
  const latestRound = draws.at(-1)?.roundNumber ?? 0;
  if (
    draws.length !== latestRound ||
    draws.some(({ roundNumber }, index) => roundNumber !== index + 1)
  ) {
    throw new Error("Lottery draw source returned an incomplete history");
  }

  const db = await getMongoDb();
  const collection = db.collection("lottery_draws");

  await collection.createIndex({ roundNumber: 1 }, { unique: true });
  await collection.bulkWrite(
    draws.map((draw) => ({
      updateOne: {
        filter: { roundNumber: draw.roundNumber },
        update: { $set: draw },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return {
    drawCount: draws.length,
    latestRound,
  };
}
