"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";
import { getLottoNumberTone } from "@/shared/lib/get-lotto-number-tone";
import { useGuestDrawLimit } from "../hooks/use-guest-draw-limit";
import { generateLottoNumbers } from "../lib/generate-lotto-numbers";
import { GuestDailySajuPromo } from "./guest-daily-saju-promo";

const NUMBER_COUNT = 6;
const REVEAL_INTERVAL_MS = 500;
const ROLLING_INTERVAL_MS = 90;

type LottoNumberPreviewProps = {
  displayName?: string;
  userId?: string;
  isConfigured?: boolean;
  isSignedIn?: boolean;
};

export function LottoNumberPreview({
  displayName,
  userId,
  isConfigured = false,
  isSignedIn = false,
}: LottoNumberPreviewProps) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [rollingNumbers, setRollingNumbers] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { drawCount, isReady, tryRecordDraw } = useGuestDrawLimit();

  useEffect(() => {
    if (!isDrawing) return;

    const timer = window.setTimeout(() => {
      const nextRevealedCount = revealedCount + 1;
      setRevealedCount(nextRevealedCount);

      if (nextRevealedCount === NUMBER_COUNT) {
        setIsDrawing(false);
      }
    }, REVEAL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isDrawing, revealedCount]);

  useEffect(() => {
    if (!isDrawing) return;

    const timer = window.setInterval(() => {
      setRollingNumbers(generateLottoNumbers());
    }, ROLLING_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isDrawing]);

  function handleGenerate() {
    if (!tryRecordDraw()) {
      toast.info(
        "이 브라우저의 무료 체험 3회를 모두 사용했어요. 카카오 로그인 후 계속 이용할 수 있어요.",
      );
      return;
    }

    const nextNumbers = generateLottoNumbers();
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setNumbers(nextNumbers);
    setHasGenerated(true);

    if (reducedMotion) {
      setRevealedCount(NUMBER_COUNT);
      setIsDrawing(false);
      return;
    }

    setRollingNumbers(generateLottoNumbers());
    setRevealedCount(0);
    setIsDrawing(true);
  }

  const isComplete = hasGenerated && !isDrawing;

  return (
    <main className="preview-shell">
      <div className="preview-orb preview-orb-top" aria-hidden="true" />
      <div className="preview-orb preview-orb-bottom" aria-hidden="true" />

      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured={isConfigured}
        isSignedIn={isSignedIn}
      />

      <section className="preview-content" aria-labelledby="preview-title">
        <div className="preview-hero-grid">
          <GuestDailySajuPromo isConfigured={isConfigured} />

          <div className="draw-card">
            <div className="draw-card-heading">
              <div>
                <p className="draw-card-label">LOTTO 6/45 · RANDOM</p>
                <h2>나만의 랜덤 조합</h2>
              </div>
              <span className="draw-card-sparkle" aria-hidden="true">
                ✳
              </span>
            </div>

            <div className="ball-tray" role="group" aria-label="로또 번호 조합">
              {Array.from({ length: NUMBER_COUNT }, (_, index) => {
                const number = numbers[index];
                const isRevealed = index < revealedCount;
                const isRolling = isDrawing && !isRevealed;
                const displayedNumber = isRevealed
                  ? number
                  : isRolling
                    ? rollingNumbers[index]
                    : undefined;

                return (
                  <div
                    className={`lotto-ball lotto-ball-${getLottoNumberTone(isRevealed ? number : undefined)}`}
                    key={index}
                    role="img"
                    aria-label={`${index + 1}번 공, ${isRevealed ? `숫자 ${number}` : isRolling ? "숫자 섞는 중" : "숫자 대기"}`}
                  >
                    <span aria-hidden="true">{displayedNumber ?? "?"}</span>
                  </div>
                );
              })}
            </div>

            <p className="draw-status" role="status" aria-live="polite">
              {isComplete ? `생성된 번호: ${numbers.join(", ")}` : ""}
            </p>
            <p className="draw-quota">
              {isReady
                ? `이 브라우저 무료 체험 ${drawCount}/3회`
                : "체험 횟수 확인 중"}
            </p>

            <button
              className={`draw-button${isDrawing ? " is-busy" : ""}`}
              type="button"
              onClick={handleGenerate}
              disabled={isDrawing || !isReady}
            >
              {isDrawing ? (
                <>
                  <span className="button-spinner" aria-hidden="true" />
                  번호를 섞는 중
                </>
              ) : hasGenerated ? (
                "다시 뽑기"
              ) : (
                "번호 뽑기"
              )}
              {!isDrawing && (
                <span className="button-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </button>

            <p className="random-disclaimer">
              무작위로 생성한 번호이며 당첨을 예측하거나 보장하지 않아요.
            </p>
          </div>
        </div>
      </section>

      <footer className="preview-footer">
        <span>행운은 가볍게, 선택은 즐겁게</span>
        <span className="footer-dot" aria-hidden="true">
          ·
        </span>
        <span>LOTTO 6/45</span>
      </footer>
    </main>
  );
}
