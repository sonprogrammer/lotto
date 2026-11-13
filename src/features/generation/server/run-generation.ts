import { revalidateTag } from "next/cache";
import { LOTTERY_DRAW_HISTORY_CACHE_TAG } from "@/entities/lottery-draw";
import { syncAndReconcileSavedCombinationDrawResults } from "@/entities/saved-combination";
import {
  getCachedWeeklyAnalysis,
  WEEKLY_ANALYSIS_CACHE_TAG,
} from "@/features/analysis";
import {
  generateCombinations,
  type GenerationConstraints,
} from "../lib/generate-combinations";
import type { GenerationRequest } from "../model/generation-request";
import { summarizeGenerationAnalysis } from "../lib/summarize-generation-analysis";
import { getGroqRecommendation } from "./groq-recommendation";

export class GenerationInputError extends Error {}

const DEFAULT_AI_PROMPT =
  "선택 번호와 집계 통계를 참고해 지원되는 조건을 추천해 주세요. 당첨 예측이나 확률 상승 주장은 하지 마세요.";

export async function runGeneration(request: GenerationRequest) {
  const syncResult = await syncAndReconcileSavedCombinationDrawResults({
    maxAttempts: 1,
  });
  if (
    request.period.type === "recent" &&
    request.period.count > syncResult.drawCount
  ) {
    throw new GenerationInputError(
      "최근 회차 수보다 큰 기간은 선택할 수 없어요.",
    );
  }
  if (syncResult.changed) {
    revalidateTag(WEEKLY_ANALYSIS_CACHE_TAG, { expire: 0 });
    revalidateTag(LOTTERY_DRAW_HISTORY_CACHE_TAG, { expire: 0 });
  }
  const { analysis, period } = await getCachedWeeklyAnalysis(
    syncResult.latestRound,
    syncResult.latestDrawVersion,
    request.period,
  );

  const customPrompt = request.prompt?.trim();
  let recommendation;
  try {
    recommendation = await getGroqRecommendation({
      prompt: customPrompt || DEFAULT_AI_PROMPT,
      fixedNumbers: request.fixedNumbers,
      analysisSummary: analysis,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("AI 조건과 고정 번호가 충돌합니다")
    ) {
      throw new GenerationInputError(error.message);
    }
    throw error;
  }

  const constraints: GenerationConstraints = recommendation.constraints;
  let combinations;
  const seed = crypto.randomUUID();
  try {
    combinations = generateCombinations({
      analysis,
      fixedNumbers: request.fixedNumbers,
      count: request.count,
      seed,
      constraints,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      /^(Impossible generation constraints|Fixed numbers conflict|Six fixed numbers)/.test(
        error.message,
      )
    ) {
      throw new GenerationInputError(
        "적용한 조건으로 요청한 조합을 만들 수 없어요. 조건을 확인해 주세요.",
      );
    }
    throw error;
  }

  return {
    combinations,
    latestRound: syncResult.latestRound,
    period,
    appliedConstraints: { fixedNumbers: request.fixedNumbers, ...constraints },
    unsupportedConditions: recommendation.unsupportedConditions,
    explanation: recommendation.explanation,
    statisticsSummary: summarizeGenerationAnalysis(analysis),
    seed,
  };
}
