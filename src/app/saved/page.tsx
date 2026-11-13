import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SavedCombinationsDashboard } from "@/features/saved-combination/components/saved-combinations-dashboard";
import { getCurrentUser } from "@/features/auth/server/current-session";

export const metadata: Metadata = {
  title: "저장한 번호 | 로또 6/45",
  description: "저장한 로또 번호 조합과 당첨 결과를 관리합니다.",
};

export const instant = false;

export default async function SavedCombinationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return (
    <SavedCombinationsDashboard
      userId={user.userId}
      displayName={user.nickname ?? undefined}
    />
  );
}
