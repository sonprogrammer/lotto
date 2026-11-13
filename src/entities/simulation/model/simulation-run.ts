import { ObjectId } from "mongodb";
import { z } from "zod";
import { LottoNumbersSchema } from "@/entities/lottery-draw";

const RankSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const SimulationCombinationResultSchema = z
  .object({
    numbers: LottoNumbersSchema,
    matchedNumberCount: z.number().int().min(0).max(6),
    bonusMatched: z.boolean(),
    rank: RankSchema.nullable(),
    amountPerWinner: z.number().int().nonnegative().nullable(),
  })
  .superRefine(({ rank, amountPerWinner }, context) => {
    if (rank === null && amountPerWinner !== 0) {
      context.addIssue({
        code: "custom",
        message: "A combination without a rank must have zero payout",
        path: ["amountPerWinner"],
      });
    }
  });

const SimulationRoundResultSchema = z
  .object({
    roundNumber: z.number().int().positive(),
    drawDate: z.date(),
    winningNumbers: LottoNumbersSchema,
    bonusNumber: z.number().int().min(1).max(45),
    analysisFirstRound: z.number().int().positive(),
    analysisLatestRound: z.number().int().positive(),
    seed: z.string().min(1),
    combinations: z.array(SimulationCombinationResultSchema).min(1).max(10),
  })
  .superRefine((round, context) => {
    if (
      round.analysisFirstRound > round.analysisLatestRound ||
      round.analysisLatestRound >= round.roundNumber ||
      round.analysisLatestRound - round.analysisFirstRound !== 29
    ) {
      context.addIssue({
        code: "custom",
        message: "Simulation analysis must contain 30 prior rounds",
        path: ["analysisLatestRound"],
      });
    }
    if (round.winningNumbers.includes(round.bonusNumber)) {
      context.addIssue({
        code: "custom",
        message: "Bonus number must not match a winning number",
        path: ["bonusNumber"],
      });
    }
  });

const SimulationTotalsSchema = z.object({
  combinationsEvaluated: z.number().int().nonnegative(),
  totalCost: z.number().int().nonnegative(),
  knownPayoutTotal: z.number().int().nonnegative(),
  unknownPayoutCount: z.number().int().nonnegative(),
  netKnownPayout: z.number().int(),
  hitsByRank: z.tuple([
    z.object({ rank: z.literal(1), count: z.number().int().nonnegative() }),
    z.object({ rank: z.literal(2), count: z.number().int().nonnegative() }),
    z.object({ rank: z.literal(3), count: z.number().int().nonnegative() }),
    z.object({ rank: z.literal(4), count: z.number().int().nonnegative() }),
    z.object({ rank: z.literal(5), count: z.number().int().nonnegative() }),
  ]),
});

export const SimulationRunDocumentSchema = z.object({
  _id: z.instanceof(ObjectId),
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  createdAt: z.date(),
  settings: z.object({
    targetRoundCount: z.literal(30),
    analysisDrawCount: z.literal(30),
    combinationsPerRound: z.number().int().min(1).max(10),
    ticketCost: z.literal(1_000),
  }),
  generatorVersion: z.literal("stats-v1"),
  baseLatestRound: z.number().int().positive(),
  totals: SimulationTotalsSchema,
  rounds: z.array(SimulationRoundResultSchema).length(30),
});

export const SimulationRunSummaryDocumentSchema =
  SimulationRunDocumentSchema.omit({ rounds: true });

export type SimulationRunDocument = z.infer<typeof SimulationRunDocumentSchema>;
export type SimulationRoundResultDocument = z.infer<
  typeof SimulationRoundResultSchema
>;
export type SimulationRoundResult = Omit<
  SimulationRoundResultDocument,
  "drawDate"
> & { drawDate: string };
export type SimulationRun = Omit<
  SimulationRunDocument,
  "_id" | "createdAt" | "rounds"
> & {
  id: string;
  createdAt: string;
  rounds: SimulationRoundResult[];
};
export type SimulationRunSummary = Omit<SimulationRun, "rounds">;
export type SimulationCombinationResult = z.infer<
  typeof SimulationCombinationResultSchema
>;
