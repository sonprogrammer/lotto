"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/notification-api";

export function useManageNotification(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}
