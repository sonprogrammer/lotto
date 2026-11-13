"use client";

import { useQuery } from "@tanstack/react-query";

export type LotterySyncStatusResponse = {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  state: "idle" | "running" | "success" | "failed";
  latestRound: number | null;
  errorSummary: string | null;
  nextExpectedAt: string;
};

async function fetchLotterySyncStatus(): Promise<LotterySyncStatusResponse> {
  const response = await fetch("/api/lottery-draws/sync-status");
  if (!response.ok) throw new Error("동기화 상태를 불러오지 못했어요.");
  return response.json() as Promise<LotterySyncStatusResponse>;
}

export function useLotterySyncStatus() {
  return useQuery({
    queryKey: ["lottery-sync-status"],
    queryFn: fetchLotterySyncStatus,
    staleTime: 60_000,
  });
}
