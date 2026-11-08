"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthControlProps = {
  isConfigured: boolean;
  isSignedIn: boolean;
};

export function AuthControl({ isConfigured, isSignedIn }: AuthControlProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function explainMissingConfiguration() {
    setErrorMessage("로그인 설정을 준비 중이에요. 잠시 후 다시 이용해 주세요.");
  }

  async function handleSignOut() {
    setErrorMessage("");
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setErrorMessage("로그아웃을 완료하지 못했어요. 다시 시도해 주세요.");
        return;
      }
      router.refresh();
    } catch {
      setErrorMessage("로그아웃을 완료하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="auth-control">
      {isSignedIn ? (
        <div className="auth-control-signed-in">
          <span className="auth-signed-in-label">카카오 로그인됨</span>
          <button
            className="auth-button auth-button-signed-in"
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
          >
            {isPending ? "로그아웃 중" : "로그아웃"}
          </button>
        </div>
      ) : isConfigured ? (
        <a className="auth-button auth-button-kakao" href="/api/auth/kakao">
          <span className="kakao-mark" aria-hidden="true">
            K
          </span>
          카카오로 로그인
        </a>
      ) : (
        <button
          className="auth-button auth-button-kakao"
          type="button"
          onClick={explainMissingConfiguration}
          disabled={isPending}
        >
          <span className="kakao-mark" aria-hidden="true">
            K
          </span>
          카카오로 로그인
        </button>
      )}
      {errorMessage && (
        <p className="auth-message" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
