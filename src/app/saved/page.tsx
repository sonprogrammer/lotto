import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SavedCombinationsDashboard } from "@/features/saved-combination/components/saved-combinations-dashboard";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { getSavedCombinationPage } from "@/entities/saved-combination/server/store";
import { SAVED_COMBINATIONS_PAGE_SIZE } from "@/entities/saved-combination/model/page";

export const metadata: Metadata = {
  title: "저장한 번호 | 로또 6/45",
  description: "저장한 로또 번호 조합과 당첨 결과를 관리합니다.",
};

export const instant = false;

export default async function SavedCombinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ combinationId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const { combinationId } = await searchParams;
  const targetPage = combinationId
    ? await getSavedCombinationPage(
        user.userId,
        combinationId,
        SAVED_COMBINATIONS_PAGE_SIZE,
      ).catch(() => null)
    : null;
  return (
    <SavedCombinationsDashboard
      userId={user.userId}
      displayName={user.nickname ?? undefined}
      targetCombinationId={targetPage ? combinationId : undefined}
      initialPage={targetPage ?? 1}
    />
  );
}
