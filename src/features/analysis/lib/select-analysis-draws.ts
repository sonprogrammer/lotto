import type { LotteryDraw } from "@/entities/lottery-draw/model/types";
import type {
  AnalysisPeriod,
  AnalysisPeriodSummary,
} from "../model/analysis-period";

export function selectAnalysisDraws(
  input: readonly LotteryDraw[],
  period: AnalysisPeriod,
): { draws: LotteryDraw[]; summary: AnalysisPeriodSummary } {
  const draws = [...input].sort(
    (left, right) => left.roundNumber - right.roundNumber,
  );

  if (
    period.type === "recent" &&
    (!Number.isInteger(period.count) || period.count < 1)
  ) {
    throw new Error("Invalid analysis period");
  }
  if (period.type === "recent" && period.count > draws.length) {
    throw new Error(
      "Requested analysis period exceeds available lottery draws",
    );
  }

  const selectedDraws =
    period.type === "all" ? draws : draws.slice(-period.count);
  const firstRound = selectedDraws[0]?.roundNumber ?? null;
  const latestRound = selectedDraws.at(-1)?.roundNumber ?? null;

  return {
    draws: selectedDraws,
    summary: {
      type: period.type,
      count: period.type === "all" ? null : period.count,
      drawCount: selectedDraws.length,
      firstRound,
      latestRound,
    },
  };
}
