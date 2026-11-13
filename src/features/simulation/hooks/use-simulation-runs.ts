import { useQuery } from "@tanstack/react-query";
import { fetchSimulationRuns } from "../api/simulation-api";
import { simulationQueryKey } from "../model/query-key";

export function useSimulationRuns(userId: string) {
  return useQuery({
    queryKey: simulationQueryKey.runs(userId),
    queryFn: fetchSimulationRuns,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}
