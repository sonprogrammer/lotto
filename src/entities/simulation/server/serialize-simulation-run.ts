import {
  SimulationRunDocumentSchema,
  SimulationRunSummaryDocumentSchema,
  type SimulationRun,
  type SimulationRunDocument,
  type SimulationRunSummary,
} from "../model/simulation-run";

export function serializeSimulationRun(
  input: SimulationRunDocument,
): SimulationRun {
  const document = SimulationRunDocumentSchema.parse(input);
  const { _id, createdAt, ...run } = document;
  return {
    ...run,
    id: _id.toHexString(),
    createdAt: createdAt.toISOString(),
    rounds: run.rounds.map(({ drawDate, ...round }) => ({
      ...round,
      drawDate: drawDate.toISOString(),
    })),
  };
}

export function serializeSimulationRunSummary(
  input: Omit<SimulationRunDocument, "rounds">,
): SimulationRunSummary {
  const document = SimulationRunSummaryDocumentSchema.parse(input);
  const { _id, createdAt, ...run } = document;
  return {
    ...run,
    id: _id.toHexString(),
    createdAt: createdAt.toISOString(),
  };
}
