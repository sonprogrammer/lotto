"use client";

import { useState } from "react";
import { notificationApi } from "../api/notification-api";

function decodeKey(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  return Uint8Array.from(
    atob(padded.replace(/-/g, "+").replace(/_/g, "/")),
    (char) => char.charCodeAt(0),
  );
}

export function usePushSubscription() {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function enable() {
    setError("");
    setPending(true);
    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      )
        throw new Error("이 브라우저에서는 푸시 알림을 사용할 수 없어요.");
      if (Notification.permission === "denied")
        throw new Error(
          "브라우저 설정에서 이 사이트의 알림 권한을 허용한 뒤 다시 시도해 주세요.",
        );
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error("브라우저 알림 권한을 허용해 주세요.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await (async () => {
          const { publicKey } = await notificationApi.publicKey();
          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeKey(publicKey),
          });
        })());
      await notificationApi.subscribe(subscription.toJSON());
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "알림을 켜지 못했어요.",
      );
    } finally {
      setPending(false);
    }
    return false;
  }
  async function disable() {
    setError("");
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await notificationApi.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "알림을 끄지 못했어요.",
      );
    } finally {
      setPending(false);
    }
    return false;
  }
  return { disable, enable, error, isPending };
}
