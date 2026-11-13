"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const ANALYSIS_STALE_TIME = 5 * 60 * 1000;
const ANALYSIS_GC_TIME = 30 * 60 * 1000;

function getAnalysisQueryKey(period: AnalysisPeriod) {
  return [
    "weekly-analysis",
    period.type,
    period.type === "recent" ? period.count : null,
  ] as const;
}

async function requestAnalysis(
  period: AnalysisPeriod,
): Promise<AnalysisRunResult> {
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
}

export function useRunWeeklyAnalysis(period: AnalysisPeriod) {
  const queryClient = useQueryClient();
  const queryKey = getAnalysisQueryKey(period);
  const analysisQuery = useQuery({
    queryKey,
    queryFn: () => requestAnalysis(period),
    enabled: false,
    staleTime: ANALYSIS_STALE_TIME,
    gcTime: ANALYSIS_GC_TIME,
  });

  async function run() {
    const cachedState = queryClient.getQueryState<AnalysisRunResult>(queryKey);
    const hasFreshCachedResult =
      cachedState?.data !== undefined &&
      !cachedState.isInvalidated &&
      Date.now() - cachedState.dataUpdatedAt < ANALYSIS_STALE_TIME;
    try {
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => requestAnalysis(period),
        staleTime: ANALYSIS_STALE_TIME,
        gcTime: ANALYSIS_GC_TIME,
      });

      if (!hasFreshCachedResult) {
        await queryClient.invalidateQueries({
          queryKey: ["lottery-draw-history"],
        });
      }
      return result;
    } finally {
      await queryClient.invalidateQueries({
        queryKey: ["lottery-sync-status"],
      });
    }
  }

  return { ...analysisQuery, run };
}
