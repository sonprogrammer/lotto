"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedCombinationCreate } from "@/entities/saved-combination/model/input";
import { createSavedCombinationRequest } from "@/entities/saved-combination/api/saved-combination-api";
import { savedCombinationsQueryKey } from "../model/query-key";

export function useSaveCombination(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavedCombinationCreate) =>
      createSavedCombinationRequest(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: savedCombinationsQueryKey(userId),
      }),
  });
}
