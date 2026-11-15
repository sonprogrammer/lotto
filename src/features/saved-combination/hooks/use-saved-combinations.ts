"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSavedCombinations } from "@/entities/saved-combination/api/saved-combination-api";
import { savedCombinationsQueryKey } from "../model/query-key";

export function useSavedCombinations(
  userId: string,
  page: number,
  targetCombinationId?: string,
) {
  return useQuery({
    queryKey: savedCombinationsQueryKey(userId, page, targetCombinationId),
    queryFn: () => fetchSavedCombinations(page, targetCombinationId),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}
