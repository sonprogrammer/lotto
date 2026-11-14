"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSajuProfileRequest } from "../api/daily-saju-api";
import {
  dailySajuRecommendationQueryKey,
  sajuProfileQueryKey,
} from "../model/query-key";

export function useDeleteSajuProfile(userId: string, dateKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSajuProfileRequest,
    onSuccess: async () => {
      queryClient.setQueryData(
        sajuProfileQueryKey(userId),
        (current: unknown) => ({
          ...(current as object),
          profile: null,
        }),
      );
      queryClient.removeQueries({
        queryKey: dailySajuRecommendationQueryKey(userId, dateKey),
      });
    },
  });
}
