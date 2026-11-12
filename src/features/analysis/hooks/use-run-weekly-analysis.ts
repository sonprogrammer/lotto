"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { WeeklyAnalysis } from "../lib/calculate-weekly-analysis";
import type {
  AnalysisPeriod,
  AnalysisPeriodSummary,
} from "../model/analysis-period";

export type AnalysisRunResult = {
  analysis: WeeklyAnalysis;
  period: AnalysisPeriodSummary;
  availableDrawCount: number;
};

export function useRunWeeklyAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (period: AnalysisPeriod): Promise<AnalysisRunResult> => {
      const response = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || "분석 자료를 가져오지 못했어요.");
      }
      return response.json() as Promise<AnalysisRunResult>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["lottery-draw-history"],
      });
    },
  });
}
