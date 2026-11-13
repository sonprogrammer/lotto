import type { SavedCombinationDocument } from "../model/document";
import type { LotteryDrawRecord } from "@/entities/lottery-draw/model/document";

type SavedCombinationDrawResult =
  SavedCombinationDocument["drawResults"][number];

type LottoNumbers = SavedCombinationDocument["numbers"];

export function calculateSavedCombinationDrawResult({
  numbers,
  draw,
}: {
  numbers: LottoNumbers;
  draw: LotteryDrawRecord;
}): SavedCombinationDrawResult {
  const winningNumbers = new Set(draw.numbers);
  const matchedNumberCount = numbers.filter((number) =>
    winningNumbers.has(number),
  ).length;
  const bonusMatched = numbers.includes(draw.bonusNumber);
  const rank = getRank(matchedNumberCount, bonusMatched);

  return {
    roundNumber: draw.roundNumber,
    drawDate: draw.drawDate,
    numbersSnapshot: numbers,
    matchedNumberCount,
    bonusMatched,
    rank,
    amountPerWinner:
      draw.prizesByRank.find((prize) => prize.rank === rank)?.amountPerWinner ??
      0,
  };
}

function getRank(
  matchedNumberCount: number,
  bonusMatched: boolean,
): 1 | 2 | 3 | 4 | 5 | null {
  if (matchedNumberCount === 6) return 1;
  if (matchedNumberCount === 5) return bonusMatched ? 2 : 3;
  if (matchedNumberCount === 4) return 4;
  if (matchedNumberCount === 3) return 5;
  return null;
}

export function resolveSavedCombinationNumbersForRound({
  numbers,
  trackingStartRound,
  numberVersions,
  roundNumber,
}: {
  numbers: LottoNumbers;
  trackingStartRound: number;
  numberVersions: SavedCombinationDocument["numberVersions"];
  roundNumber: number;
}): LottoNumbers | null {
  const version = numberVersions.find(
    ({ fromRound, throughRound }) =>
      roundNumber >= fromRound && roundNumber <= throughRound,
  );
  if (version) return version.numbers;
  return roundNumber >= trackingStartRound ? numbers : null;
}
