import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationDashboard } from "@/features/notification/components/notification-dashboard";
import { getCurrentUser } from "@/features/auth/server/current-session";

export const metadata: Metadata = {
  title: "알림함 | 로또 6/45",
  description: "저장한 번호의 당첨 알림을 확인합니다.",
};

export const instant = false;

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return (
    <NotificationDashboard
      userId={user.userId}
      displayName={user.nickname ?? undefined}
    />
  );
}
