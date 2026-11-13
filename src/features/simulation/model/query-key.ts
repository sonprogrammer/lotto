export const simulationQueryKey = {
  runs: (userId: string) => ["simulations", userId, "runs"] as const,
  run: (userId: string, runId: string) =>
    ["simulations", userId, "run", runId] as const,
};
