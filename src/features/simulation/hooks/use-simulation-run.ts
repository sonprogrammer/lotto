import { useQuery } from "@tanstack/react-query";
import { fetchSimulationRun } from "../api/simulation-api";
import { simulationQueryKey } from "../model/query-key";

export function useSimulationRun(userId: string, runId?: string) {
  return useQuery({
    queryKey: simulationQueryKey.run(userId, runId ?? "none"),
    queryFn: () => fetchSimulationRun(runId!),
    enabled: Boolean(userId && runId),
    staleTime: 30_000,
  });
}
