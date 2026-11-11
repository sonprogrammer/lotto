"use client";

import { useAuthControl } from "../hooks/use-auth-control";

type AuthControlProps = {
  displayName?: string;
  isConfigured: boolean;
  isSignedIn: boolean;
};

export function AuthControl({
  displayName,
  isConfigured,
  isSignedIn,
}: AuthControlProps) {
  const {
    errorMessage,
    explainMissingConfiguration,
    isPending,
    signOut,
    startSignIn,
  } = useAuthControl();

  return (
    <div className="auth-control">
      {isSignedIn ? (
        <div className="auth-control-signed-in">
          <span className="auth-signed-in-label">
            {displayName || "이름 확인 필요"}
          </span>
          {!displayName && (
            <button
              className="auth-profile-refresh-button"
              type="button"
              onClick={startSignIn}
              disabled={isPending}
            >
              카카오 프로필 갱신
            </button>
          )}
          <button
            className="auth-button auth-button-signed-in"
            type="button"
            onClick={signOut}
            disabled={isPending}
          >
            {isPending ? "로그아웃 중" : "로그아웃"}
          </button>
        </div>
      ) : isConfigured ? (
        <button
          className="auth-button auth-button-kakao"
          type="button"
          onClick={startSignIn}
          disabled={isPending}
        >
          <span className="kakao-mark" aria-hidden="true">
            K
          </span>
          카카오로 로그인
        </button>
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
