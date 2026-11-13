import { z } from "zod";

export const SimulationRequestSchema = z
  .object({
    combinationsPerRound: z.number().int().min(1).max(10).default(5),
  })
  .strict();

export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;
