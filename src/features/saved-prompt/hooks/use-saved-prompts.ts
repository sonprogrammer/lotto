"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSavedPrompts } from "../api/saved-prompt-api";
import { savedPromptsQueryKey } from "../model/query-key";

export function useSavedPrompts(userId: string) {
  return useQuery({
    queryKey: savedPromptsQueryKey(userId),
    queryFn: fetchSavedPrompts,
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
