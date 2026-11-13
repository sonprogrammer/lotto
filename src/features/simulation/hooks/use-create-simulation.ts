import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSimulation } from "../api/simulation-api";
import { simulationQueryKey } from "../model/query-key";

export function useCreateSimulation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSimulation,
    onSuccess: (run) => {
      queryClient.setQueryData(simulationQueryKey.run(userId, run.id), run);
      void queryClient.invalidateQueries({
        queryKey: simulationQueryKey.runs(userId),
      });
    },
  });
}
