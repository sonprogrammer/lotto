import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listLotteryDraws } from "@/entities/lottery-draw";
import { AnalysisDashboard } from "@/features/analysis/components/analysis-dashboard";
import {
  calculateWeeklyAnalysis,
  type WeeklyAnalysis,
} from "@/features/analysis";
import { getCurrentUser } from "@/features/auth/server/current-session";

export const metadata: Metadata = {
  title: "이번 주 분석 | 로또 6/45",
  description: "전체 공개 회차의 로또 6/45 통계 분석을 확인합니다.",
};

export const instant = false;

export default async function AnalysisPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  let analysis: WeeklyAnalysis | null = null;
  let state: "ready" | "error" = "ready";

  try {
    const draws = await listLotteryDraws();
    analysis = calculateWeeklyAnalysis(draws);
  } catch {
    state = "error";
  }

  return (
    <AnalysisDashboard
      analysis={analysis}
      displayName={currentUser.nickname}
      state={state}
    />
  );
}
