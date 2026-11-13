"use client";

import { NotificationInbox } from "./notification-inbox";
import { NotificationSettings } from "./notification-settings";
import { SiteHeader } from "@/widgets/site-header";

export function NotificationDashboard({
  userId,
  displayName,
}: {
  userId: string;
  displayName?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
      <div className="mx-auto max-w-3xl pt-10">
        <header className="mb-6">
          <p className="text-sm font-medium text-blue-700">
            {displayName ? `${displayName}님의 알림` : "내 알림"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            알림함
          </h1>
          <p className="mt-2 text-slate-600">
            저장한 번호의 당첨 결과와 정정 내역을 확인할 수 있어요.
          </p>
        </header>
        <NotificationSettings />
        <NotificationInbox userId={userId} />
      </div>
    </main>
  );
}
