import type { Metadata } from "next";
import { AnalysisDashboard } from "@/features/analysis/components/analysis-dashboard";

export const metadata: Metadata = {
  title: "이번 주 분석 | 로또 6/45",
  description: "전체 공개 회차의 로또 6/45 통계 분석을 확인합니다.",
};

export default function AnalysisPage() {
  return <AnalysisDashboard />;
}
