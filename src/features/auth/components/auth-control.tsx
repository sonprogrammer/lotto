"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthControlProps = {
  isConfigured: boolean;
  isSignedIn: boolean;
};

export function AuthControl({ isConfigured, isSignedIn }: AuthControlProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignIn() {
    setErrorMessage("");

    if (!isConfigured) {
      setErrorMessage(
        "로그인 설정을 준비 중이에요. Supabase 연결 후 이용해 주세요.",
      );
      return;
    }

    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: callbackUrl.toString() },
      });

      if (error) {
        setErrorMessage(
          "카카오 로그인 연결을 시작하지 못했어요. 설정을 확인해 주세요.",
        );
      }
    } catch {
      setErrorMessage(
        "카카오 로그인 연결을 시작하지 못했어요. 설정을 확인해 주세요.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleSignOut() {
    setErrorMessage("");
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
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
      ) : (
        <button
          className="auth-button auth-button-kakao"
          type="button"
          onClick={handleSignIn}
          disabled={isPending}
        >
          <span className="kakao-mark" aria-hidden="true">
            K
          </span>
          {isPending ? "로그인 연결 중" : "카카오로 로그인"}
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
