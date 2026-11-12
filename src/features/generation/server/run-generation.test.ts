import { beforeEach, expect, it, vi } from "vitest";
import { calculateWeeklyAnalysis } from "@/features/analysis/lib/calculate-weekly-analysis";
import { runGeneration, GenerationInputError } from "./run-generation";

const {
  syncLotteryDrawsMock,
  getCachedWeeklyAnalysisMock,
  getGroqRecommendationMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  syncLotteryDrawsMock: vi.fn(),
  getCachedWeeklyAnalysisMock: vi.fn(),
  getGroqRecommendationMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: revalidateTagMock }));
vi.mock("@/entities/lottery-draw", () => ({
  syncLotteryDraws: syncLotteryDrawsMock,
  LOTTERY_DRAW_HISTORY_CACHE_TAG: "lottery-draw-history",
}));
vi.mock("@/features/analysis/server/get-cached-weekly-analysis", () => ({
  getCachedWeeklyAnalysis: getCachedWeeklyAnalysisMock,
  WEEKLY_ANALYSIS_CACHE_TAG: "weekly-analysis",
}));
vi.mock("./groq-recommendation", () => ({
  getGroqRecommendation: getGroqRecommendationMock,
}));

const analysis = calculateWeeklyAnalysis([
  { roundNumber: 10, numbers: [1, 2, 3, 11, 23, 45] },
]);
const period = { type: "recent" as const, count: 1 };
const summary = { ...period, drawCount: 1, firstRound: 10, latestRound: 10 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("crypto", { randomUUID: () => "seed-one" });
  syncLotteryDrawsMock.mockResolvedValue({
    drawCount: 10,
    latestRound: 10,
    latestDrawVersion: "version-10",
    changed: false,
  });
  getCachedWeeklyAnalysisMock.mockResolvedValue({
    analysis,
    period: summary,
    availableDrawCount: 10,
  });
  getGroqRecommendationMock.mockResolvedValue({
    constraints: { excludedNumbers: [44] },
    unsupportedConditions: ["지원하지 않는 조건"],
    explanation: "집계 통계를 참고했습니다.",
  });
});

it("uses latest public draw, selected period, one explanation and a recorded seed", async () => {
  const result = await runGeneration({
    method: "automatic",
    period,
    fixedNumbers: [],
    count: 2,
  });
  expect(getCachedWeeklyAnalysisMock).toHaveBeenCalledWith(
    10,
    "version-10",
    period,
  );
  expect(getGroqRecommendationMock).toHaveBeenCalledOnce();
  expect(result).toMatchObject({
    latestRound: 10,
    period: summary,
    seed: "seed-one",
    explanation: "집계 통계를 참고했습니다.",
    appliedConstraints: { fixedNumbers: [] },
    unsupportedConditions: [],
  });
  expect(result.combinations).toHaveLength(2);
});

it("does not apply AI constraints in selected mode", async () => {
  const result = await runGeneration({
    method: "selected",
    period,
    fixedNumbers: [44],
    count: 1,
  });
  expect(result.combinations[0].numbers).toContain(44);
  expect(result.appliedConstraints).toEqual({ fixedNumbers: [44] });
});

it("applies parsed AI constraints in AI-assisted mode", async () => {
  const result = await runGeneration({
    method: "ai-assisted",
    period,
    fixedNumbers: [3],
    count: 1,
    prompt: "44 제외",
  });
  expect(result.combinations[0].numbers).toContain(3);
  expect(result.combinations[0].numbers).not.toContain(44);
  expect(result.appliedConstraints).toEqual({
    fixedNumbers: [3],
    excludedNumbers: [44],
  });
  expect(result.unsupportedConditions).toEqual(["지원하지 않는 조건"]);
  expect(getGroqRecommendationMock).toHaveBeenCalledWith({
    prompt: "44 제외",
    fixedNumbers: [3],
    analysisSummary: analysis,
  });
});

it("rejects a period longer than available history", async () => {
  await expect(
    runGeneration({
      method: "automatic",
      period: { type: "recent", count: 30 },
      fixedNumbers: [],
      count: 1,
    }),
  ).rejects.toBeInstanceOf(GenerationInputError);
  expect(getCachedWeeklyAnalysisMock).not.toHaveBeenCalled();
});

it("rejects conflicting AI conditions without generating combinations", async () => {
  getGroqRecommendationMock.mockResolvedValue({
    constraints: { excludedNumbers: [3] },
    unsupportedConditions: [],
    explanation: "요약",
  });
  await expect(
    runGeneration({
      method: "ai-assisted",
      period,
      fixedNumbers: [3],
      count: 1,
    }),
  ).rejects.toBeInstanceOf(GenerationInputError);
});

it("propagates source failures as retryable upstream errors", async () => {
  syncLotteryDrawsMock.mockRejectedValue(new Error("source unavailable"));
  await expect(
    runGeneration({ method: "automatic", period, fixedNumbers: [], count: 1 }),
  ).rejects.toThrow("source unavailable");
});
