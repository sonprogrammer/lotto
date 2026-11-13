import { beforeEach, expect, it, vi } from "vitest";
import { calculateWeeklyAnalysis } from "@/features/analysis";
import { runGeneration, GenerationInputError } from "./run-generation";
import { GroqProviderError } from "./groq-recommendation";

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
  runLotteryDrawSync: syncLotteryDrawsMock,
  LOTTERY_DRAW_HISTORY_CACHE_TAG: "lottery-draw-history",
}));
vi.mock("@/features/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/analysis")>()),
  getCachedWeeklyAnalysis: getCachedWeeklyAnalysisMock,
  WEEKLY_ANALYSIS_CACHE_TAG: "weekly-analysis",
}));
vi.mock("./groq-recommendation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./groq-recommendation")>()),
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

it("accepts no fixed numbers and applies one recommendation to multiple combinations", async () => {
  const result = await runGeneration({
    period,
    fixedNumbers: [],
    count: 3,
  });
  expect(getCachedWeeklyAnalysisMock).toHaveBeenCalledWith(
    10,
    "version-10",
    period,
  );
  expect(getGroqRecommendationMock).toHaveBeenCalledOnce();
  expect(getGroqRecommendationMock).toHaveBeenCalledWith({
    prompt:
      "선택 번호와 집계 통계를 참고해 지원되는 조건을 추천해 주세요. 당첨 예측이나 확률 상승 주장은 하지 마세요.",
    fixedNumbers: [],
    analysisSummary: analysis,
  });
  expect(result).toMatchObject({
    latestRound: 10,
    period: summary,
    seed: "seed-one",
    explanation: "집계 통계를 참고했습니다.",
    appliedConstraints: { fixedNumbers: [], excludedNumbers: [44] },
    unsupportedConditions: ["지원하지 않는 조건"],
    statisticsSummary: {
      mostFrequentNumbers: [1, 2, 3, 11, 23].map((number) => ({
        number,
        count: 1,
      })),
      longestCurrentAbsences: [1, 2, 3, 11, 23].map((number) => ({
        number,
        drawsSinceLastAppearance: 0,
      })),
    },
  });
  expect(result.combinations).toHaveLength(3);
  for (const combination of result.combinations) {
    expect(combination.numbers).not.toContain(44);
  }
});

it("replaces the default with a trimmed custom prompt and preserves all fixed numbers", async () => {
  const result = await runGeneration({
    period,
    fixedNumbers: [3, 8, 17],
    count: 2,
    prompt: "  44 제외  ",
  });
  expect(getGroqRecommendationMock).toHaveBeenCalledOnce();
  expect(getGroqRecommendationMock).toHaveBeenCalledWith({
    prompt: "44 제외",
    fixedNumbers: [3, 8, 17],
    analysisSummary: analysis,
  });
  expect(result.appliedConstraints).toEqual({
    fixedNumbers: [3, 8, 17],
    excludedNumbers: [44],
  });
  expect(result.unsupportedConditions).toEqual(["지원하지 않는 조건"]);
  for (const combination of result.combinations) {
    expect(combination.numbers).toEqual(expect.arrayContaining([3, 8, 17]));
    expect(combination.numbers).not.toContain(44);
  }
});

it.each([undefined, "", "   "])(
  "uses the default prompt and recommendation constraints for an empty prompt %s",
  async (prompt) => {
    const result = await runGeneration({
      period,
      fixedNumbers: [3, 8],
      count: 1,
      prompt,
    });
    expect(getGroqRecommendationMock).toHaveBeenCalledOnce();
    expect(getGroqRecommendationMock).toHaveBeenCalledWith({
      prompt:
        "선택 번호와 집계 통계를 참고해 지원되는 조건을 추천해 주세요. 당첨 예측이나 확률 상승 주장은 하지 마세요.",
      fixedNumbers: [3, 8],
      analysisSummary: analysis,
    });
    expect(result.appliedConstraints).toEqual({
      fixedNumbers: [3, 8],
      excludedNumbers: [44],
    });
    expect(result.combinations[0].numbers).toEqual(
      expect.arrayContaining([3, 8]),
    );
    expect(result.combinations[0].numbers).not.toContain(44);
  },
);

it("rejects a period longer than available history", async () => {
  await expect(
    runGeneration({
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
      period,
      fixedNumbers: [3],
      count: 1,
    }),
  ).rejects.toBeInstanceOf(GenerationInputError);
});

it("propagates source failures as retryable upstream errors", async () => {
  syncLotteryDrawsMock.mockRejectedValue(new Error("source unavailable"));
  await expect(
    runGeneration({ period, fixedNumbers: [], count: 1 }),
  ).rejects.toThrow("source unavailable");
});

it("converts provider fixed-number conflicts into input errors", async () => {
  getGroqRecommendationMock.mockRejectedValue(
    new Error("AI 조건과 고정 번호가 충돌합니다: 제외 번호를 확인해 주세요."),
  );
  await expect(
    runGeneration({ period, fixedNumbers: [3], count: 1 }),
  ).rejects.toBeInstanceOf(GenerationInputError);
  expect(getGroqRecommendationMock).toHaveBeenCalledOnce();
});

it.each(["rate-limit", "timeout", "invalid-response", "upstream"] as const)(
  "propagates Groq %s errors without making another recommendation call",
  async (kind) => {
    const error = new GroqProviderError(kind, "provider failed");
    getGroqRecommendationMock.mockRejectedValue(error);
    await expect(
      runGeneration({ period, fixedNumbers: [], count: 2 }),
    ).rejects.toBe(error);
    expect(getGroqRecommendationMock).toHaveBeenCalledOnce();
  },
);
