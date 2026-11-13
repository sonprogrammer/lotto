import { listRecentLotteryDrawRecords } from "@/entities/lottery-draw";
import { createSimulationRun } from "@/entities/simulation";
import { runSimulation, SimulationInputError } from "../lib/run-simulation";

export { SimulationInputError };

export async function createSimulationForUser(
  userId: string,
  combinationsPerRound: number,
) {
  const draws = await listRecentLotteryDrawRecords(60);
  const draft = runSimulation({ draws, combinationsPerRound });
  return createSimulationRun(userId, draft);
}
