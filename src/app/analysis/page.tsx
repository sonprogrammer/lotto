import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalysisDashboard } from "@/features/analysis/components/analysis-dashboard";
import { getCurrentUser } from "@/features/auth/server/current-session";

export const metadata: Metadata = {
  title: "이번 주 분석 | 로또 6/45",
  description: "전체 공개 회차의 로또 6/45 통계 분석을 확인합니다.",
};

export const instant = false;

export default async function AnalysisPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  return <AnalysisDashboard displayName={currentUser.nickname ?? undefined} />;
}
