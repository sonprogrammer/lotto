import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SimulationDashboard } from "@/features/simulation/components/simulation-dashboard";
import { getCurrentUser } from "@/features/auth/server/current-session";

export const metadata: Metadata = {
  title: "과거 회차 시뮬레이션 | 로또 6/45",
  description:
    "과거 회차 전에 공개된 통계로 생성한 조합을 실제 당첨 결과와 비교합니다.",
};

export const instant = false;

export default async function SimulationPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  return (
    <SimulationDashboard
      displayName={currentUser.nickname ?? undefined}
      userId={currentUser.userId}
    />
  );
}
