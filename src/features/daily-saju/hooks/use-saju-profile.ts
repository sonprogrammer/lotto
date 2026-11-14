"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSajuProfile } from "../api/daily-saju-api";
import { sajuProfileQueryKey } from "../model/query-key";

export function useSajuProfile(userId: string) {
  return useQuery({
    queryKey: sajuProfileQueryKey(userId),
    queryFn: fetchSajuProfile,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}
