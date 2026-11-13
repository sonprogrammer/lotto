import { calculateWeeklyAnalysis } from "@/features/analysis";
import { generateCombinations } from "@/features/generation";
import type { LotteryDrawRecord } from "@/entities/lottery-draw";
import { evaluateCombination } from "@/entities/simulation";

const TARGET_ROUND_COUNT = 30;
const ANALYSIS_DRAW_COUNT = 30;
const TICKET_COST = 1_000;

type RunSimulationInput = {
  draws: readonly LotteryDrawRecord[];
  combinationsPerRound: number;
};

export class SimulationInputError extends Error {}

export function runSimulation({
  draws,
  combinationsPerRound,
}: RunSimulationInput) {
  if (
    !Number.isInteger(combinationsPerRound) ||
    combinationsPerRound < 1 ||
    combinationsPerRound > 10
  ) {
    throw new SimulationInputError(
      "Combination count must be between 1 and 10",
    );
  }

  const orderedDraws = [...draws].sort(
    (left, right) => left.roundNumber - right.roundNumber,
  );
  if (orderedDraws.length < TARGET_ROUND_COUNT + ANALYSIS_DRAW_COUNT) {
    throw new SimulationInputError("At least 60 completed rounds are required");
  }

  const latestDraws = orderedDraws.slice(
    -(TARGET_ROUND_COUNT + ANALYSIS_DRAW_COUNT),
  );
  if (
    latestDraws.some(
      (draw, index) =>
        index > 0 &&
        draw.roundNumber !== latestDraws[index - 1].roundNumber + 1,
    )
  ) {
    throw new SimulationInputError(
      "Simulation draw history must be continuous",
    );
  }

  const targetDraws = latestDraws.slice(ANALYSIS_DRAW_COUNT);
  const rounds = targetDraws.map((targetDraw, targetIndex) => {
    const precedingDraws = latestDraws.slice(
      targetIndex,
      targetIndex + ANALYSIS_DRAW_COUNT,
    );
    const analysis = calculateWeeklyAnalysis(
      precedingDraws.map(({ roundNumber, numbers }) => ({
        roundNumber,
        numbers,
      })),
    );
    const seed = `historical-simulation:v1:${targetDraw.roundNumber}:${combinationsPerRound}`;
    const combinations = generateCombinations({
      analysis,
      fixedNumbers: [],
      count: combinationsPerRound,
      seed,
    }).map(({ numbers }) => ({
      numbers: numbers as LotteryDrawRecord["numbers"],
      ...evaluateCombination(numbers, targetDraw),
    }));

    return {
      roundNumber: targetDraw.roundNumber,
      drawDate: targetDraw.drawDate,
      winningNumbers: targetDraw.numbers,
      bonusNumber: targetDraw.bonusNumber,
      analysisFirstRound: precedingDraws[0].roundNumber,
      analysisLatestRound: precedingDraws.at(-1)!.roundNumber,
      seed,
      combinations,
    };
  });

  const allCombinations = rounds.flatMap(({ combinations }) => combinations);
  const hitsByRank = ([1, 2, 3, 4, 5] as const).map((rank) => ({
    rank,
    count: allCombinations.filter((combination) => combination.rank === rank)
      .length,
  })) as [
    { rank: 1; count: number },
    { rank: 2; count: number },
    { rank: 3; count: number },
    { rank: 4; count: number },
    { rank: 5; count: number },
  ];
  const totalCost = allCombinations.length * TICKET_COST;
  const knownPayoutTotal = allCombinations.reduce(
    (total, combination) => total + (combination.amountPerWinner ?? 0),
    0,
  );

  return {
    settings: {
      targetRoundCount: TARGET_ROUND_COUNT as 30,
      analysisDrawCount: ANALYSIS_DRAW_COUNT as 30,
      combinationsPerRound,
      ticketCost: TICKET_COST as 1_000,
    },
    generatorVersion: "stats-v1" as const,
    baseLatestRound: latestDraws.at(-1)!.roundNumber,
    totals: {
      combinationsEvaluated: allCombinations.length,
      totalCost,
      knownPayoutTotal,
      unknownPayoutCount: allCombinations.filter(
        ({ rank, amountPerWinner }) =>
          rank !== null && amountPerWinner === null,
      ).length,
      netKnownPayout: knownPayoutTotal - totalCost,
      hitsByRank,
    },
    rounds,
  };
}
