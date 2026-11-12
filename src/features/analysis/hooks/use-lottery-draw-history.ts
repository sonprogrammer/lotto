"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export type LotteryDrawHistoryRow = {
  roundNumber: number;
  drawDate: string;
  numbers: number[];
  bonusNumber: number;
  prizesByRank: Array<{
    rank: number;
    winnerCount: number;
    amountPerWinner: number;
  }>;
};

type LotteryDrawHistoryPage = {
  draws: LotteryDrawHistoryRow[];
  nextCursor: number | null;
};

async function fetchLotteryDrawHistory(
  beforeRound: number | null,
): Promise<LotteryDrawHistoryPage> {
  const params = new URLSearchParams({ limit: "20" });
  if (beforeRound !== null) params.set("cursor", String(beforeRound));

  const response = await fetch(`/api/lottery-draws?${params.toString()}`);
  if (!response.ok) throw new Error("당첨 내역을 불러오지 못했어요.");
  return response.json() as Promise<LotteryDrawHistoryPage>;
}

export function useLotteryDrawHistory() {
  return useInfiniteQuery({
    queryKey: ["lottery-draw-history"],
    queryFn: ({ pageParam }) => fetchLotteryDrawHistory(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 5 * 60 * 1000,
  });
}
