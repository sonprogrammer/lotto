import type { WeeklyAnalysis } from "@/features/analysis";
import type { GenerationStatisticsSummary } from "../model/generation-statistics-summary";

export function summarizeGenerationAnalysis(
  analysis: WeeklyAnalysis,
): GenerationStatisticsSummary {
  return {
    mostFrequentNumbers: analysis.numberFrequencies
      .filter(({ count }) => count > 0)
      .sort(
        (left, right) => right.count - left.count || left.number - right.number,
      )
      .slice(0, 5)
      .map(({ number, count }) => ({ number, count })),
    longestCurrentAbsences: analysis.numberFrequencies
      .flatMap(({ number, drawsSinceLastAppearance }) =>
        drawsSinceLastAppearance === null
          ? []
          : [{ number, drawsSinceLastAppearance }],
      )
      .sort(
        (left, right) =>
          right.drawsSinceLastAppearance - left.drawsSinceLastAppearance ||
          left.number - right.number,
      )
      .slice(0, 5),
  };
}
