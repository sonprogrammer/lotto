import { getMongoDb } from "@/shared/server/mongodb/client";
import { parseLotteryDrawSourceResponse } from "./source-response";

const ALL_DRAWS_URL =
  "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=all";
const LATEST_DRAW_URL =
  "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do";

export async function syncLotteryDraws(): Promise<{
  drawCount: number;
  latestRound: number;
}> {
  const [allDrawsResponse, latestDrawResponse] = await Promise.all([
    fetchLotteryDrawSource(ALL_DRAWS_URL),
    fetchLotteryDrawSource(LATEST_DRAW_URL),
  ]);
  const draws = parseLotteryDrawSourceResponse(allDrawsResponse).sort(
    (left, right) => left.roundNumber - right.roundNumber,
  );
  const [latestPublishedDraw] =
    parseLotteryDrawSourceResponse(latestDrawResponse);
  const latestRound = draws.at(-1)?.roundNumber ?? 0;
  if (
    draws.length !== latestRound ||
    draws.some(({ roundNumber }, index) => roundNumber !== index + 1)
  ) {
    throw new Error("Lottery draw source returned an incomplete history");
  }
  if (
    latestPublishedDraw.roundNumber !== latestRound ||
    JSON.stringify(draws.at(-1)) !== JSON.stringify(latestPublishedDraw)
  ) {
    throw new Error(
      "Lottery draw history does not match the latest published round",
    );
  }

  const db = await getMongoDb();
  const collection = db.collection("lottery_draws");

  await collection.createIndex({ roundNumber: 1 }, { unique: true });
  const storedLatestDraw = await collection.findOne(
    {},
    { projection: { _id: 0, roundNumber: 1 }, sort: { roundNumber: -1 } },
  );
  if (storedLatestDraw && storedLatestDraw.roundNumber > latestRound) {
    throw new Error(
      "Stored lottery history is newer than the provider response",
    );
  }
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

async function fetchLotteryDrawSource(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error("Lottery draw source request failed");
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Lottery draw source returned a non-JSON response");
  }
  return response.json();
}
