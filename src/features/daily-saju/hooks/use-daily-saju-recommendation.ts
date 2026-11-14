"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySajuRecommendation } from "../api/daily-saju-api";
import { dailySajuRecommendationQueryKey } from "../model/query-key";

export function useDailySajuRecommendation(
  userId: string,
  dateKey: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: dailySajuRecommendationQueryKey(userId, dateKey),
    queryFn: fetchDailySajuRecommendation,
    enabled: Boolean(userId && dateKey && enabled),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === "generating" ? 3000 : false,
  });
}
