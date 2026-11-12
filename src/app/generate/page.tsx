import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { GenerationDashboard } from "@/features/generation/components/generation-dashboard";

export const metadata: Metadata = {
  title: "번호 조합 생성 | 로또 6/45",
  description: "과거 통계를 참고해 원하는 번호 조합을 생성합니다.",
};

export default async function GeneratePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");
  return (
    <GenerationDashboard displayName={currentUser.nickname ?? undefined} />
  );
}
