import type { Metadata } from "next";
import { NotificationDashboard } from "@/features/notification/components/notification-dashboard";

export const metadata: Metadata = {
  title: "알림함 | 로또 6/45",
  description: "저장한 번호의 당첨 알림을 확인합니다.",
};

export default function NotificationsPage() {
  return <NotificationDashboard />;
}
