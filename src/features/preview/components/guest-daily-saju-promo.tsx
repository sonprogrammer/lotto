"use client";

import { useAuthControl } from "@/features/auth/hooks/use-auth-control";

type GuestDailySajuPromoProps = { isConfigured: boolean };

export function GuestDailySajuPromo({
  isConfigured,
}: GuestDailySajuPromoProps) {
  const { errorMessage, explainMissingConfiguration, isPending, startSignIn } =
    useAuthControl();

  function handleSignIn() {
    if (isConfigured) {
      startSignIn();
      return;
    }

    explainMissingConfiguration();
  }

  return (
    <div className="preview-promo">
      <p className="preview-eyebrow">
        <span className="preview-live-dot" aria-hidden="true" />
        오늘의 작은 행운을 만나보세요
      </p>
      <h1 id="preview-title">
        행운은 가볍게,
        <br />
        오늘은 특별하게
      </h1>
      <p className="preview-description">
        무작위 번호는 지금 바로 뽑아보고,
        <br className="desktop-break" />
        로그인 후 사주 정보를 등록하면 매일 사주 기반 행운 숫자를 확인할 수
        있어요.
      </p>

      <div className="preview-saju-card">
        <span className="preview-saju-icon" aria-hidden="true">
          ✦
        </span>
        <span className="preview-saju-ball" aria-hidden="true">
          ?
        </span>
        <div>
          <p className="preview-saju-label">YOUR DAILY NUMBER</p>
          <h2>오늘의 사주 숫자</h2>
          <p>
            로그인 후 사주 정보를 등록하면 매일 새로운 숫자를 확인할 수 있어요.
          </p>
        </div>
      </div>

      <button
        className="preview-saju-cta"
        type="button"
        onClick={handleSignIn}
        disabled={isPending}
      >
        <span className="kakao-mark" aria-hidden="true">
          K
        </span>
        카카오로 로그인하기
        <span className="preview-saju-cta-arrow" aria-hidden="true">
          →
        </span>
      </button>
      {errorMessage && (
        <p className="preview-saju-error" role="alert">
          {errorMessage}
        </p>
      )}
      <p className="preview-saju-note">
        사주 숫자는 재미를 위한 참고 정보예요.
      </p>
    </div>
  );
}
