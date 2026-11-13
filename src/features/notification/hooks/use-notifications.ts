"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "../api/notification-api";

export function useNotifications(userId: string, page: number) {
  return useQuery({
    queryKey: ["notifications", userId, page],
    queryFn: () => notificationApi.list(page),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}
