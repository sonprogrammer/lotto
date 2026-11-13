"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const SIGN_IN_PATH = "/api/auth/kakao";
const SIGN_OUT_PATH = "/api/auth/logout";
const SIGN_OUT_ERROR = "로그아웃을 완료하지 못했어요. 다시 시도해 주세요.";

export function useAuthControl() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function startSignIn() {
    // OAuth must begin as a full document navigation.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(SIGN_IN_PATH);
  }

  async function signOut() {
    setErrorMessage("");
    setIsPending(true);

    try {
      const registration =
        "serviceWorker" in navigator && "PushManager" in window
          ? await navigator.serviceWorker.getRegistration("/")
          : undefined;
      const subscription = await registration?.pushManager.getSubscription();
      const response = await fetch(SIGN_OUT_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription?.endpoint ?? null }),
      });
      if (!response.ok) {
        setErrorMessage(SIGN_OUT_ERROR);
        return;
      }
      try {
        await subscription?.unsubscribe();
      } catch {
        // Server-side removal already prevents future sends to this device.
      }
      queryClient.clear();
      router.refresh();
    } catch {
      setErrorMessage(SIGN_OUT_ERROR);
    } finally {
      setIsPending(false);
    }
  }

  function explainMissingConfiguration() {
    setErrorMessage("로그인 설정을 준비 중이에요. 잠시 후 다시 이용해 주세요.");
  }

  return {
    errorMessage,
    explainMissingConfiguration,
    isPending,
    signOut,
    startSignIn,
  };
}
