import { describe, expect, it } from "vitest";
import type { LotteryDrawRecord } from "@/entities/lottery-draw";
import { runSimulation } from "./run-simulation";

function makeDraws(count = 90): LotteryDrawRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const roundNumber = index + 1;
    const start = ((index * 7) % 40) + 1;
    const numbers = Array.from({ length: 6 }, (_, offset) => start + offset);
    const bonusNumber = numbers.at(-1)! === 45 ? 1 : numbers.at(-1)! + 1;
    return {
      roundNumber,
      drawDate: new Date(Date.UTC(2020, 0, roundNumber)),
      numbers: numbers as LotteryDrawRecord["numbers"],
      bonusNumber,
      prizesByRank: [
        { rank: 1 as const, winnerCount: 1, amountPerWinner: 1_000_000_000 },
        { rank: 2 as const, winnerCount: 2, amountPerWinner: 50_000_000 },
        { rank: 3 as const, winnerCount: 3, amountPerWinner: 1_000_000 },
        { rank: 4 as const, winnerCount: 4, amountPerWinner: 50_000 },
        { rank: 5 as const, winnerCount: 5, amountPerWinner: 5_000 },
      ],
    };
  });
}

describe("runSimulation", () => {
  it("simulates only the latest 30 target rounds", () => {
    const result = runSimulation({
      draws: makeDraws(),
      combinationsPerRound: 5,
    });

    expect(result.rounds).toHaveLength(30);
    expect(result.rounds[0].roundNumber).toBe(61);
    expect(result.rounds.at(-1)?.roundNumber).toBe(90);
    expect(result.baseLatestRound).toBe(90);
  });

  it("uses exactly the 30 rounds preceding each target round", () => {
    const result = runSimulation({
      draws: makeDraws(),
      combinationsPerRound: 2,
    });

    expect(result.rounds[0]).toMatchObject({
      roundNumber: 61,
      analysisFirstRound: 31,
      analysisLatestRound: 60,
    });
    expect(result.rounds.at(-1)).toMatchObject({
      roundNumber: 90,
      analysisFirstRound: 60,
      analysisLatestRound: 89,
    });
  });

  it("does not use the target draw or later draws to generate its combinations", () => {
    const draws = makeDraws();
    const changedTargetAndLaterDraws = draws.map((draw) => {
      if (draw.roundNumber < 61) return draw;
      return {
        ...draw,
        numbers: [40, 41, 42, 43, 44, 45] as LotteryDrawRecord["numbers"],
        bonusNumber: draw.roundNumber % 2 ? 1 : 2,
      };
    });

    const original = runSimulation({ draws, combinationsPerRound: 5 });
    const changed = runSimulation({
      draws: changedTargetAndLaterDraws,
      combinationsPerRound: 5,
    });

    expect(
      changed.rounds[0].combinations.map(({ numbers }) => numbers),
    ).toEqual(original.rounds[0].combinations.map(({ numbers }) => numbers));
    expect(changed.rounds[0].winningNumbers).not.toEqual(
      original.rounds[0].winningNumbers,
    );
  });

  it("reproduces identical rounds and totals for identical draws and settings", () => {
    const first = runSimulation({
      draws: makeDraws(),
      combinationsPerRound: 5,
    });
    const second = runSimulation({
      draws: makeDraws(),
      combinationsPerRound: 5,
    });

    expect(second).toEqual(first);
  });

  it("uses the configured ticket count and 1,000 won cost per combination", () => {
    const result = runSimulation({
      draws: makeDraws(),
      combinationsPerRound: 3,
    });

    expect(
      result.rounds.every(({ combinations }) => combinations.length === 3),
    ).toBe(true);
    expect(result.totals).toMatchObject({
      combinationsEvaluated: 90,
      totalCost: 90_000,
      netKnownPayout: result.totals.knownPayoutTotal - 90_000,
    });
  });

  it("rejects fewer than 60 rounds and combination counts outside 1–10", () => {
    expect(() =>
      runSimulation({ draws: makeDraws(59), combinationsPerRound: 5 }),
    ).toThrow("At least 60 completed rounds are required");
    expect(() =>
      runSimulation({ draws: makeDraws(), combinationsPerRound: 11 }),
    ).toThrow("Combination count must be between 1 and 10");
  });

  it("requires the latest 60 draws to be a continuous sequence", () => {
    const draws = makeDraws();
    draws[70] = { ...draws[70], roundNumber: 100 };

    expect(() => runSimulation({ draws, combinationsPerRound: 5 })).toThrow(
      "Simulation draw history must be continuous",
    );
  });

  it("counts winning tickets with unknown historical payout separately", () => {
    const draws = makeDraws().map((draw) => ({
      ...draw,
      prizesByRank: [],
    }));
    const result = runSimulation({ draws, combinationsPerRound: 10 });
    const winningTicketCount = result.rounds
      .flatMap(({ combinations }) => combinations)
      .filter(({ rank }) => rank !== null).length;

    expect(result.totals.knownPayoutTotal).toBe(0);
    expect(result.totals.unknownPayoutCount).toBe(winningTicketCount);
  });
});
