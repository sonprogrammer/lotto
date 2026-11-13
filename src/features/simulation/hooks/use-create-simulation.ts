import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SimulationRunSummary } from "@/entities/simulation";
import { createSimulation } from "../api/simulation-api";
import { simulationQueryKey } from "../model/query-key";

export function useCreateSimulation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSimulation,
    onSuccess: (run) => {
      queryClient.setQueryData(simulationQueryKey.run(userId, run.id), run);
      const summary: SimulationRunSummary = run;
      queryClient.setQueryData<SimulationRunSummary[]>(
        simulationQueryKey.runs(userId),
        (runs = []) =>
          [summary, ...runs.filter(({ id }) => id !== run.id)].slice(0, 20),
      );
      void queryClient.invalidateQueries({
        queryKey: simulationQueryKey.runs(userId),
      });
    },
  });
}
