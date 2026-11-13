"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "../api/notification-api";

export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: ["notifications", userId, "unread-count"],
    queryFn: notificationApi.unreadCount,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}
