"use client";

import { useEffect, useState } from "react";
import { usePushSubscription } from "../hooks/use-push-subscription";

export function NotificationSettings() {
  const [isSubscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const push = usePushSubscription();
  useEffect(() => {
    const available =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    window.setTimeout(() => setSupported(available), 0);
    if (available)
      void navigator.serviceWorker
        .getRegistration("/")
        .then(async (registration) =>
          setSubscribed(
            Boolean(await registration?.pushManager.getSubscription()),
          ),
        );
  }, []);
  async function toggle() {
    const succeeded = isSubscribed ? await push.disable() : await push.enable();
    if (succeeded !== false) setSubscribed(!isSubscribed);
  }
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">이 기기의 푸시 알림</h2>
      <p
        className="mt-1 text-sm text-slate-600"
        role={supported === null ? "status" : undefined}
      >
        {supported === null
          ? "브라우저 알림 기능을 확인하고 있어요."
          : !supported
            ? "이 브라우저에서는 푸시 알림을 지원하지 않아요."
            : isSubscribed
              ? "이 기기에서 알림을 받고 있어요."
              : "알림함은 계속 사용할 수 있고, 푸시는 선택 사항이에요."}
      </p>
      {supported === true && (
        <button
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={push.isPending}
          onClick={() => void toggle()}
        >
          {push.isPending
            ? "처리 중…"
            : isSubscribed
              ? "이 기기 알림 끄기"
              : "이 기기 알림 켜기"}
        </button>
      )}
      {push.error && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {push.error}
        </p>
      )}
    </section>
  );
}
