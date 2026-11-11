"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SIGN_IN_PATH = "/api/auth/kakao";
const SIGN_OUT_PATH = "/api/auth/logout";
const SIGN_OUT_ERROR = "로그아웃을 완료하지 못했어요. 다시 시도해 주세요.";

export function useAuthControl() {
  const router = useRouter();
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
      const response = await fetch(SIGN_OUT_PATH, { method: "POST" });
      if (!response.ok) {
        setErrorMessage(SIGN_OUT_ERROR);
        return;
      }
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
