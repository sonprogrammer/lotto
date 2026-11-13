import type { NotificationPage } from "@/entities/notification/model/notification";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error("알림 요청을 완료하지 못했어요.");
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const notificationApi = {
  list: (page = 1) =>
    request<NotificationPage>(`/api/notifications?page=${page}`),
  unreadCount: () =>
    request<{ count: number }>("/api/notifications/unread-count"),
  markRead: (id: string) =>
    request(`/api/notifications/${id}/read`, { method: "POST" }),
  subscribe: (subscription: PushSubscriptionJSON) =>
    request<void>("/api/push-subscriptions", {
      method: "POST",
      body: JSON.stringify({ ...subscription, userAgent: navigator.userAgent }),
    }),
  unsubscribe: (endpoint: string) =>
    request<void>("/api/push-subscriptions", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),
  publicKey: () => request<{ publicKey: string }>("/api/push/public-key"),
};
