import { beforeEach, expect, it, vi } from "vitest";

const { listLotteryDrawsMock } = vi.hoisted(() => ({
  listLotteryDrawsMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock("@/entities/lottery-draw", () => ({
  listLotteryDraws: listLotteryDrawsMock,
}));

import { getCachedWeeklyAnalysis } from "./get-cached-weekly-analysis";

beforeEach(() => {
  vi.clearAllMocks();
  listLotteryDrawsMock.mockResolvedValue([
    { roundNumber: 1247, numbers: [1, 2, 3, 4, 5, 6] },
    { roundNumber: 1248, numbers: [2, 11, 16, 25, 34, 35] },
    { roundNumber: 1249, numbers: [1, 12, 17, 26, 33, 44] },
  ]);
});

it("calculates and reports only the selected recent rounds", async () => {
  const result = await getCachedWeeklyAnalysis(1249, "version-1249", {
    type: "recent",
    count: 2,
  });

  expect(result.period).toEqual({
    type: "recent",
    count: 2,
    drawCount: 2,
    firstRound: 1248,
    latestRound: 1249,
  });
  expect(result.availableDrawCount).toBe(3);
  expect(result.analysis.drawCount).toBe(2);
  expect(result.analysis.latestRound).toBe(1249);
});

it("rejects cached history from a different latest round", async () => {
  await expect(
    getCachedWeeklyAnalysis(1250, "version-1250", { type: "all" }),
  ).rejects.toThrow(
    "Lottery history changed while analysis was being prepared",
  );
});
