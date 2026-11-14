"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type ManualLotterySyncResult = {
  changed: boolean;
  latestRound: number;
};

async function requestManualLotterySync(): Promise<ManualLotterySyncResult> {
  const response = await fetch("/api/lottery-draws/sync", { method: "POST" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error || "당첨 번호를 확인하지 못했어요.");
  }
  return response.json() as Promise<ManualLotterySyncResult>;
}

export function useManualLotterySync() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: requestManualLotterySync,
    onSuccess: async ({ changed }) => {
      if (!changed) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["lottery-draw-history"],
        }),
        queryClient.invalidateQueries({ queryKey: ["weekly-analysis"] }),
      ]);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["lottery-sync-status"] }),
  });

  return {
    isPending: mutation.isPending,
    message: mutation.data
      ? mutation.data.changed
        ? `${mutation.data.latestRound}회 당첨 결과를 반영했어요.`
        : `새로 반영된 결과가 없어요. 현재 ${mutation.data.latestRound}회까지 확인했어요.`
      : null,
    errorMessage:
      mutation.error instanceof Error ? mutation.error.message : null,
    sync: () => mutation.mutate(),
  };
}
