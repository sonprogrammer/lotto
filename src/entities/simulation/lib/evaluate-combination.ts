import type { LotteryDrawRecord } from "@/entities/lottery-draw";

export type EvaluatedCombination = {
  matchedNumberCount: number;
  bonusMatched: boolean;
  rank: 1 | 2 | 3 | 4 | 5 | null;
  amountPerWinner: number | null;
};

export function evaluateCombination(
  numbers: readonly number[],
  draw: LotteryDrawRecord,
): EvaluatedCombination {
  const winningNumbers = new Set(draw.numbers);
  const matchedNumberCount = numbers.filter((number) =>
    winningNumbers.has(number),
  ).length;
  const bonusMatched = numbers.includes(draw.bonusNumber);
  const rank = getRank(matchedNumberCount, bonusMatched);

  return {
    matchedNumberCount,
    bonusMatched,
    rank,
    amountPerWinner:
      rank === null
        ? 0
        : (draw.prizesByRank.find((prize) => prize.rank === rank)
            ?.amountPerWinner ?? null),
  };
}

function getRank(
  matchedNumberCount: number,
  bonusMatched: boolean,
): EvaluatedCombination["rank"] {
  if (matchedNumberCount === 6) return 1;
  if (matchedNumberCount === 5) return bonusMatched ? 2 : 3;
  if (matchedNumberCount === 4) return 4;
  if (matchedNumberCount === 3) return 5;
  return null;
}
