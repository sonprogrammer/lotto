import { getMongoDb } from "@/shared/server/mongodb/client";
import { LotteryDrawRecordSchema } from "../model/document";
import { createLotteryDrawCacheVersion } from "./cache-version";
import { parseLotteryDrawSourceResponse } from "./source-response";

const ALL_DRAWS_URL =
  "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=all";
const LATEST_DRAW_URL =
  "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do";

export async function syncLotteryDraws(): Promise<{
  drawCount: number;
  latestRound: number;
  latestDrawVersion: string;
  changed: boolean;
}> {
  const latestDrawResponse = await fetchLotteryDrawSource(LATEST_DRAW_URL);
  const latestPublishedDraw = parseLotteryDrawSourceResponse(latestDrawResponse)
    .sort((left, right) => left.roundNumber - right.roundNumber)
    .at(-1);
  if (!latestPublishedDraw) throw new Error("Latest lottery draw is missing");
  const latestRound = latestPublishedDraw.roundNumber;

  const db = await getMongoDb();
  const collection = db.collection("lottery_draws");

  await collection.createIndex({ roundNumber: 1 }, { unique: true });
  const storedLatestDocument = await collection.findOne(
    {},
    {
      projection: {
        _id: 0,
        roundNumber: 1,
        drawDate: 1,
        numbers: 1,
        bonusNumber: 1,
        prizesByRank: 1,
      },
      sort: { roundNumber: -1 },
    },
  );
  const storedLatestDraw = storedLatestDocument
    ? LotteryDrawRecordSchema.parse(storedLatestDocument)
    : null;

  if (storedLatestDraw && storedLatestDraw.roundNumber > latestRound) {
    throw new Error(
      "Stored lottery history is newer than the provider response",
    );
  }

  const storedDrawCount = await collection.countDocuments({});
  const latestDrawVersion = createLotteryDrawCacheVersion(latestPublishedDraw);
  if (
    storedLatestDraw?.roundNumber === latestRound &&
    storedDrawCount === latestRound &&
    createLotteryDrawCacheVersion(storedLatestDraw) === latestDrawVersion
  ) {
    return {
      drawCount: latestRound,
      latestRound,
      latestDrawVersion,
      changed: false,
    };
  }

  const allDrawsResponse = await fetchLotteryDrawSource(ALL_DRAWS_URL);
  const draws = parseLotteryDrawSourceResponse(allDrawsResponse).sort(
    (left, right) => left.roundNumber - right.roundNumber,
  );
  if (
    draws.length !== latestRound ||
    draws.some(({ roundNumber }, index) => roundNumber !== index + 1)
  ) {
    throw new Error("Lottery draw source returned an incomplete history");
  }
  if (JSON.stringify(draws.at(-1)) !== JSON.stringify(latestPublishedDraw)) {
    throw new Error(
      "Lottery draw history does not match the latest published round",
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
    latestDrawVersion,
    changed: true,
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
