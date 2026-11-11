import type { LotteryDraw } from "@/entities/lottery-draw/model/types";

const NUMBER_BANDS = [
  { start: 1, end: 10 },
  { start: 11, end: 20 },
  { start: 21, end: 30 },
  { start: 31, end: 40 },
  { start: 41, end: 45 },
] as const;

type NumberFrequency = {
  number: number;
  count: number;
  drawsSinceLastAppearance: number | null;
};

export type WeeklyAnalysis = {
  drawCount: number;
  latestRound: number | null;
  numberFrequencies: NumberFrequency[];
  oddCountDistribution: number[];
  lowCountDistribution: number[];
  numberBandCounts: Array<{ start: number; end: number; count: number }>;
  consecutiveDrawCount: number;
  consecutivePairCount: number;
  longestConsecutiveRun: number;
};

export function calculateWeeklyAnalysis(
  input: readonly LotteryDraw[],
): WeeklyAnalysis {
  const draws = [...input].sort(
    (left, right) => left.roundNumber - right.roundNumber,
  );
  validateDraws(draws);

  const frequencyCounts = Array.from({ length: 46 }, () => 0);
  const lastAppearance = Array.from({ length: 46 }, () => -1);
  const oddCountDistribution = Array.from({ length: 7 }, () => 0);
  const lowCountDistribution = Array.from({ length: 7 }, () => 0);
  const numberBandCounts = NUMBER_BANDS.map((band) => ({ ...band, count: 0 }));
  let consecutiveDrawCount = 0;
  let consecutivePairCount = 0;
  let longestConsecutiveRun = 0;

  draws.forEach((draw, drawIndex) => {
    let oddCount = 0;
    let lowCount = 0;
    const sortedNumbers = [...draw.numbers].sort((left, right) => left - right);
    let currentRun = 1;
    let drawLongestRun = 1;

    for (let index = 0; index < sortedNumbers.length; index += 1) {
      const number = sortedNumbers[index];
      frequencyCounts[number] += 1;
      lastAppearance[number] = drawIndex;
      if (number % 2 === 1) oddCount += 1;
      if (number <= 22) lowCount += 1;

      const band = numberBandCounts.find(
        ({ start, end }) => number >= start && number <= end,
      );
      if (band) band.count += 1;

      if (index > 0 && number === sortedNumbers[index - 1] + 1) {
        consecutivePairCount += 1;
        currentRun += 1;
        drawLongestRun = Math.max(drawLongestRun, currentRun);
      } else {
        currentRun = 1;
      }
    }

    oddCountDistribution[oddCount] += 1;
    lowCountDistribution[lowCount] += 1;
    if (drawLongestRun > 1) consecutiveDrawCount += 1;
    longestConsecutiveRun = Math.max(longestConsecutiveRun, drawLongestRun);
  });

  return {
    drawCount: draws.length,
    latestRound: draws.at(-1)?.roundNumber ?? null,
    numberFrequencies: Array.from({ length: 45 }, (_, index) => {
      const number = index + 1;
      const lastIndex = lastAppearance[number];
      return {
        number,
        count: frequencyCounts[number],
        drawsSinceLastAppearance:
          lastIndex < 0 ? null : draws.length - 1 - lastIndex,
      };
    }),
    oddCountDistribution,
    lowCountDistribution,
    numberBandCounts,
    consecutiveDrawCount,
    consecutivePairCount,
    longestConsecutiveRun: draws.length > 0 ? longestConsecutiveRun : 0,
  };
}

function validateDraws(draws: readonly LotteryDraw[]) {
  let previousRound = 0;

  for (const draw of draws) {
    const numbers = new Set(draw.numbers);
    if (
      !Number.isInteger(draw.roundNumber) ||
      draw.roundNumber <= previousRound ||
      draw.numbers.length !== 6 ||
      numbers.size !== 6 ||
      draw.numbers.some(
        (number) => !Number.isInteger(number) || number < 1 || number > 45,
      )
    ) {
      throw new Error("Invalid lottery draw data");
    }
    previousRound = draw.roundNumber;
  }
}
