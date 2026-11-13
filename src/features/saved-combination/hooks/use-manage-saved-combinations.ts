"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteSavedCombinationRequest,
  deleteSavedCombinationsRequest,
  updateSavedCombinationRequest,
} from "@/entities/saved-combination/api/saved-combination-api";
import { savedCombinationsQueryKey } from "../model/query-key";

export function useManageSavedCombinations(userId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: savedCombinationsQueryKey(userId),
    });
  return {
    update: useMutation({
      mutationFn: ({ id, numbers }: { id: string; numbers: number[] }) =>
        updateSavedCombinationRequest(id, numbers),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: deleteSavedCombinationRequest,
      onSuccess: refresh,
    }),
    removeMany: useMutation({
      mutationFn: deleteSavedCombinationsRequest,
      onSuccess: refresh,
    }),
  };
}
