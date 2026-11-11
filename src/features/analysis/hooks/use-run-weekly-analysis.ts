"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { WeeklyAnalysis } from "../lib/calculate-weekly-analysis";

export type AnalysisRunResult = {
  analysis: WeeklyAnalysis;
  drawCount: number;
  latestRound: number;
};

export function useRunWeeklyAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<AnalysisRunResult> => {
      const response = await fetch("/api/analysis/run", { method: "POST" });
      if (!response.ok) throw new Error("분석 자료를 가져오지 못했어요.");
      return response.json() as Promise<AnalysisRunResult>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["lottery-draw-history"],
      });
    },
  });
}
