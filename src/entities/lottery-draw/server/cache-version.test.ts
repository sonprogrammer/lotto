import { describe, expect, it } from "vitest";
import { LotteryDrawRecordSchema } from "../model/document";
import { createLotteryDrawCacheVersion } from "./cache-version";

const draw = LotteryDrawRecordSchema.parse({
  roundNumber: 1249,
  drawDate: new Date("2026-11-07T00:00:00.000Z"),
  numbers: [2, 11, 16, 25, 34, 35],
  bonusNumber: 14,
  prizesByRank: [
    { rank: 1 as const, winnerCount: 1, amountPerWinner: 1000 },
    { rank: 2 as const, winnerCount: 2, amountPerWinner: 500 },
  ],
});

describe("createLotteryDrawCacheVersion", () => {
  it("returns the same version for the same public draw data", () => {
    expect(createLotteryDrawCacheVersion(draw)).toBe(
      createLotteryDrawCacheVersion({
        ...draw,
        prizesByRank: [...draw.prizesByRank].reverse(),
      }),
    );
  });

  it("changes when a draw or its prize data changes", () => {
    const version = createLotteryDrawCacheVersion(draw);

    expect(
      createLotteryDrawCacheVersion({
        ...draw,
        numbers: [1, 11, 16, 25, 34, 35] as const,
      }),
    ).not.toBe(version);
    expect(
      createLotteryDrawCacheVersion({
        ...draw,
        prizesByRank: [
          { rank: 1, winnerCount: 2, amountPerWinner: 1000 },
          draw.prizesByRank[1],
        ],
      }),
    ).not.toBe(version);
  });

  it("marks an empty draw collection consistently", () => {
    expect(createLotteryDrawCacheVersion(null)).toBe("empty");
  });
});
