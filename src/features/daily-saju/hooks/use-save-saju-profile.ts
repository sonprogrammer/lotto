"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SajuProfileInput } from "@/entities/user";
import { saveSajuProfileRequest } from "../api/daily-saju-api";
import { sajuProfileQueryKey } from "../model/query-key";

export function useSaveSajuProfile(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SajuProfileInput) => saveSajuProfileRequest(input),
    onSuccess: (profile) =>
      queryClient.setQueryData(
        sajuProfileQueryKey(userId),
        (current: unknown) => ({
          ...(current as object),
          profile,
        }),
      ),
  });
}
