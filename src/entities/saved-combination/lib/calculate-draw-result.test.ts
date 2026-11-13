import { describe, expect, it } from "vitest";
import {
  calculateSavedCombinationDrawResult,
  resolveSavedCombinationNumbersForRound,
} from "@/entities/saved-combination/lib/calculate-draw-result";

const draw = {
  roundNumber: 100,
  drawDate: new Date("2026-11-07T00:00:00.000Z"),
  numbers: [1, 2, 3, 4, 5, 6] as [
    number,
    number,
    number,
    number,
    number,
    number,
  ],
  bonusNumber: 7,
  prizesByRank: [
    { rank: 1 as const, winnerCount: 1, amountPerWinner: 1_000_000_000 },
    { rank: 2 as const, winnerCount: 2, amountPerWinner: 50_000_000 },
    { rank: 3 as const, winnerCount: 3, amountPerWinner: 1_000_000 },
    { rank: 4 as const, winnerCount: 4, amountPerWinner: 50_000 },
    { rank: 5 as const, winnerCount: 5, amountPerWinner: 5_000 },
  ],
};

describe("calculateSavedCombinationDrawResult", () => {
  it.each([
    { numbers: [1, 2, 3, 4, 5, 6], rank: 1, matched: 6, bonus: false },
    { numbers: [1, 2, 3, 4, 5, 7], rank: 2, matched: 5, bonus: true },
    { numbers: [1, 2, 3, 4, 5, 8], rank: 3, matched: 5, bonus: false },
    { numbers: [1, 2, 3, 4, 8, 9], rank: 4, matched: 4, bonus: false },
    { numbers: [1, 2, 3, 8, 9, 10], rank: 5, matched: 3, bonus: false },
    { numbers: [1, 2, 8, 9, 10, 11], rank: null, matched: 2, bonus: false },
  ] as const)("calculates rank $rank", ({ numbers, rank, matched, bonus }) => {
    const resolvedNumbers = [...numbers] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const result = calculateSavedCombinationDrawResult({
      numbers: resolvedNumbers,
      draw,
    });

    expect(result).toMatchObject({
      roundNumber: 100,
      drawDate: draw.drawDate,
      numbersSnapshot: resolvedNumbers,
      matchedNumberCount: matched,
      bonusMatched: bonus,
      rank,
      amountPerWinner: rank ? draw.prizesByRank[rank - 1].amountPerWinner : 0,
    });
  });

  it("uses the edited numbers starting at trackingStartRound", () => {
    const currentNumbers = [10, 11, 12, 13, 14, 15] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const previousNumbers = [1, 2, 3, 4, 5, 6] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const versions = [
      { numbers: previousNumbers, fromRound: 20, throughRound: 24 },
    ];

    expect(
      resolveSavedCombinationNumbersForRound({
        numbers: currentNumbers,
        trackingStartRound: 25,
        numberVersions: versions,
        roundNumber: 24,
      }),
    ).toEqual(previousNumbers);
    expect(
      resolveSavedCombinationNumbersForRound({
        numbers: currentNumbers,
        trackingStartRound: 25,
        numberVersions: versions,
        roundNumber: 25,
      }),
    ).toEqual(currentNumbers);
  });
});
