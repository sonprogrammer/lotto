export type GenerationStatisticsSummary = {
  mostFrequentNumbers: Array<{ number: number; count: number }>;
  longestCurrentAbsences: Array<{
    number: number;
    drawsSinceLastAppearance: number;
  }>;
};
