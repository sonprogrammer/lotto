import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { SimulationRunDocumentSchema } from "./simulation-run";

const validRun = {
  _id: new ObjectId(),
  userId: "65ab12cd34ef56ab78cd90ef",
  createdAt: new Date("2026-11-14T00:00:00.000Z"),
  settings: {
    targetRoundCount: 30,
    analysisDrawCount: 30,
    combinationsPerRound: 5,
    ticketCost: 1_000,
  },
  generatorVersion: "stats-v1",
  baseLatestRound: 100,
  totals: {
    combinationsEvaluated: 150,
    totalCost: 150_000,
    knownPayoutTotal: 5_000,
    unknownPayoutCount: 0,
    netKnownPayout: -145_000,
    hitsByRank: [
      { rank: 1, count: 0 },
      { rank: 2, count: 0 },
      { rank: 3, count: 0 },
      { rank: 4, count: 0 },
      { rank: 5, count: 1 },
    ],
  },
  rounds: Array.from({ length: 30 }, (_, index) => {
    const roundNumber = 71 + index;
    return {
      roundNumber,
      drawDate: new Date("2026-11-07T00:00:00.000Z"),
      winningNumbers: [1, 2, 3, 4, 5, 6],
      bonusNumber: 7,
      analysisFirstRound: roundNumber - 30,
      analysisLatestRound: roundNumber - 1,
      seed: `historical-simulation:v1:${roundNumber}:5`,
      combinations: [
        {
          numbers: [1, 2, 3, 4, 5, 8],
          matchedNumberCount: 5,
          bonusMatched: false,
          rank: 3 as const,
          amountPerWinner: 5_000,
        },
      ],
    };
  }),
};

describe("SimulationRunDocumentSchema", () => {
  it("accepts a reproducible simulation run with its result rounds", () => {
    expect(SimulationRunDocumentSchema.safeParse(validRun).success).toBe(true);
  });

  it.each([
    { userId: "invalid" },
    { baseLatestRound: 0 },
    { settings: { ...validRun.settings, combinationsPerRound: 11 } },
    { generatorVersion: "unknown" },
    { rounds: [{ ...validRun.rounds[0], analysisLatestRound: 100 }] },
    {
      rounds: [
        {
          ...validRun.rounds[0],
          combinations: [
            { ...validRun.rounds[0].combinations[0], amountPerWinner: -1 },
          ],
        },
      ],
    },
  ])("rejects invalid field values", (override) => {
    expect(
      SimulationRunDocumentSchema.safeParse({ ...validRun, ...override })
        .success,
    ).toBe(false);
  });

  it("accepts an unknown payout only for a matched prize rank", () => {
    const run = {
      ...validRun,
      rounds: validRun.rounds.map((round, index) =>
        index === 0
          ? {
              ...round,
              combinations: round.combinations.map((combination) => ({
                ...combination,
                amountPerWinner: null,
              })),
            }
          : round,
      ),
    };

    expect(SimulationRunDocumentSchema.safeParse(run).success).toBe(true);
  });
});
