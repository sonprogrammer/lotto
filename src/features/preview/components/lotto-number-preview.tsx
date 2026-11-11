"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";
import { generateLottoNumbers } from "../lib/generate-lotto-numbers";

const NUMBER_COUNT = 6;
const REVEAL_INTERVAL_MS = 500;
const ROLLING_INTERVAL_MS = 90;

type LottoNumberPreviewProps = {
  displayName?: string;
  isConfigured?: boolean;
  isSignedIn?: boolean;
};

function getBallColor(number: number | undefined) {
  if (number === undefined || number <= 10) return "gold";
  if (number <= 20) return "blue";
  if (number <= 30) return "red";
  if (number <= 40) return "gray";
  return "green";
}

export function LottoNumberPreview({
  displayName,
  isConfigured = false,
  isSignedIn = false,
}: LottoNumberPreviewProps) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [rollingNumbers, setRollingNumbers] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

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
        isConfigured={isConfigured}
        isSignedIn={isSignedIn}
      />

      <section className="preview-content" aria-labelledby="preview-title">
        <p className="preview-eyebrow">이번 주, 가볍게 한 번</p>
        <h1 id="preview-title">
          행운의 번호를
          <br />
          만나보세요
        </h1>
        <p className="preview-description">
          버튼을 누르면 무작위 번호 6개가
          <br className="desktop-break" />
          공이 멈추는 순서대로 공개돼요.
        </p>

        <div className="draw-card">
          <div className="draw-card-heading">
            <div>
              <p className="draw-card-label">LOTTO 6/45</p>
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
                  className={`lotto-ball lotto-ball-${getBallColor(isRevealed ? number : undefined)}`}
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

          <button
            className={`draw-button${isDrawing ? " is-busy" : ""}`}
            type="button"
            onClick={handleGenerate}
            disabled={isDrawing}
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
