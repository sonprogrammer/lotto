"use client";

import { useMutation } from "@tanstack/react-query";
import type { AnalysisPeriodSummary } from "@/features/analysis/model/analysis-period";
import type { GeneratedCombination } from "../lib/generate-combinations";
import type { GenerationRequest } from "../model/generation-request";

export type GenerationResult = {
  combinations: GeneratedCombination[];
  latestRound: number;
  period: AnalysisPeriodSummary;
  appliedConstraints: {
    fixedNumbers: number[];
    excludedNumbers?: number[];
    oddCount?: number;
    lowCount?: number;
    minNumber?: number;
    maxNumber?: number;
    allowConsecutive?: boolean;
  };
  unsupportedConditions: string[];
  explanation: string;
  seed: string;
};

export function useGenerateCombinations() {
  return useMutation<GenerationResult, Error, GenerationRequest>({
    mutationFn: async (request) => {
      const response = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error || "조합을 만들지 못했어요. 다시 시도해 주세요.",
        );
      }
      return response.json() as Promise<GenerationResult>;
    },
  });
}
