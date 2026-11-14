"use client";

import Link from "next/link";
import { useUnreadNotificationCount } from "../hooks/use-unread-notification-count";

export function NotificationBell({
  userId,
  isActive,
}: {
  userId: string;
  isActive?: boolean;
}) {
  const ariaCurrent = isActive ? "page" : undefined;
  const { data, isError } = useUnreadNotificationCount(userId);
  if (isError)
    return (
      <Link
        className="analysis-link"
        href="/notifications"
        aria-current={ariaCurrent}
      >
        알림함
      </Link>
    );
  return (
    <Link
      className="analysis-link relative"
      href="/notifications"
      aria-current={ariaCurrent}
    >
      알림함
      {(data?.count ?? 0) > 0 && (
        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs text-white">
          {data?.count}
        </span>
      )}
    </Link>
  );
}
