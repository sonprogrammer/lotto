import { cacheLife, cacheTag } from "next/cache";
import { listLotteryDraws } from "@/entities/lottery-draw";
import { calculateWeeklyAnalysis } from "../lib/calculate-weekly-analysis";
import { selectAnalysisDraws } from "../lib/select-analysis-draws";
import type {
  AnalysisPeriod,
  AnalysisPeriodSummary,
} from "../model/analysis-period";
import type { WeeklyAnalysis } from "../lib/calculate-weekly-analysis";

export const WEEKLY_ANALYSIS_CACHE_TAG = "weekly-analysis";

export type CachedWeeklyAnalysis = {
  analysis: WeeklyAnalysis;
  period: AnalysisPeriodSummary;
  availableDrawCount: number;
};

export async function getCachedWeeklyAnalysis(
  latestRound: number,
  latestDrawVersion: string,
  period: AnalysisPeriod,
): Promise<CachedWeeklyAnalysis> {
  "use cache";

  cacheLife("weeks");
  cacheTag(WEEKLY_ANALYSIS_CACHE_TAG);
  void latestDrawVersion;

  const allDraws = await listLotteryDraws();
  if (allDraws.at(-1)?.roundNumber !== latestRound) {
    throw new Error(
      "Lottery history changed while analysis was being prepared",
    );
  }

  const selected = selectAnalysisDraws(allDraws, period);

  return {
    analysis: calculateWeeklyAnalysis(selected.draws),
    period: selected.summary,
    availableDrawCount: allDraws.length,
  };
}
