import { describe, expect, it } from "vitest";
import { evaluateCombination } from "./evaluate-combination";

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

describe("evaluateCombination", () => {
  it.each([
    { numbers: [1, 2, 3, 4, 5, 6], rank: 1, matchedNumberCount: 6 },
    { numbers: [1, 2, 3, 4, 5, 7], rank: 2, matchedNumberCount: 5 },
    { numbers: [1, 2, 3, 4, 5, 8], rank: 3, matchedNumberCount: 5 },
    { numbers: [1, 2, 3, 4, 8, 9], rank: 4, matchedNumberCount: 4 },
    { numbers: [1, 2, 3, 8, 9, 10], rank: 5, matchedNumberCount: 3 },
    { numbers: [1, 2, 8, 9, 10, 11], rank: null, matchedNumberCount: 2 },
  ] as const)("assigns rank $rank", ({ numbers, rank, matchedNumberCount }) => {
    expect(evaluateCombination(numbers, draw)).toMatchObject({
      matchedNumberCount,
      rank,
    });
  });

  it("uses the bonus number only to distinguish second place", () => {
    expect(evaluateCombination([1, 2, 3, 4, 5, 7], draw)).toMatchObject({
      rank: 2,
      bonusMatched: true,
    });
    expect(evaluateCombination([1, 2, 3, 4, 5, 8], draw)).toMatchObject({
      rank: 3,
      bonusMatched: false,
    });
  });

  it("leaves a winning payout unknown when that rank is absent", () => {
    const drawWithoutThirdPrize = {
      ...draw,
      prizesByRank: draw.prizesByRank.filter(({ rank }) => rank !== 3),
    };

    expect(
      evaluateCombination([1, 2, 3, 4, 5, 8], drawWithoutThirdPrize),
    ).toEqual({
      matchedNumberCount: 5,
      bonusMatched: false,
      rank: 3,
      amountPerWinner: null,
    });
  });

  it("uses zero payout for a ticket with no winning rank", () => {
    expect(evaluateCombination([1, 2, 8, 9, 10, 11], draw)).toMatchObject({
      rank: null,
      amountPerWinner: 0,
    });
  });
});
