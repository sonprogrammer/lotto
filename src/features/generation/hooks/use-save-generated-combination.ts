"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedCombinationCreate } from "@/entities/saved-combination/model/input";
import { createSavedCombinationRequest } from "@/entities/saved-combination/api/saved-combination-api";

export function useSaveGeneratedCombination(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavedCombinationCreate) =>
      createSavedCombinationRequest(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["saved-combinations", userId],
      }),
  });
}
