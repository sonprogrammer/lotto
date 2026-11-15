import type { Metadata } from "next";
import { GenerationDashboard } from "@/features/generation/components/generation-dashboard";

export const metadata: Metadata = {
  title: "번호 조합 생성 | 로또 6/45",
  description: "과거 통계를 참고해 원하는 번호 조합을 생성합니다.",
};

export default function GeneratePage() {
  return <GenerationDashboard />;
}
