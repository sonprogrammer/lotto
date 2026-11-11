"use client";

import { SiteHeader } from "@/widgets/site-header";
import { useRunWeeklyAnalysis } from "../hooks/use-run-weekly-analysis";
import { FrequencyGapHelp } from "./frequency-gap-help";

type AnalysisDashboardProps = {
  displayName?: string;
};

function getNumberTone(number: number) {
  if (number <= 10) return "gold";
  if (number <= 20) return "blue";
  if (number <= 30) return "red";
  if (number <= 40) return "gray";
  return "green";
}

export function AnalysisDashboard({ displayName }: AnalysisDashboardProps) {
  const analysisRequest = useRunWeeklyAnalysis();
  const analysisResult = analysisRequest.data;
  const analysis = analysisResult?.analysis;

  return (
    <main className="analysis-shell">
      <SiteHeader displayName={displayName} isConfigured isSignedIn />
      <section className="analysis-content" aria-labelledby="analysis-title">
        <p className="analysis-eyebrow">LOTTO 6/45 · 데이터 기반 분석</p>
        <h1 id="analysis-title">이번 주 분석</h1>
        <p className="analysis-intro">
          공개된 과거 당첨 번호를 정해진 기준으로 살펴봅니다.
          <br />
          분석은 참고 자료이며 당첨을 예측하거나 보장하지 않아요.
        </p>

        <button
          className="analysis-run-button"
          type="button"
          disabled={analysisRequest.isPending}
          onClick={() => analysisRequest.mutate()}
        >
          {analysisRequest.isPending
            ? "분석 중"
            : analysisRequest.isError
              ? "다시 분석하기"
              : "분석하기"}
        </button>

        {analysisRequest.isPending ? (
          <div
            className="analysis-loading-state"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <p>
              전체 회차 자료를 확인하고 있어요. 처음 조회할 때는 잠시 걸릴 수
              있어요.
            </p>
            <div className="analysis-skeleton analysis-skeleton-meta" />
            <div className="analysis-skeleton analysis-skeleton-card" />
            <div className="analysis-skeleton-grid">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  className="analysis-skeleton analysis-skeleton-card"
                  key={index}
                />
              ))}
            </div>
          </div>
        ) : analysisRequest.isError ? (
          <div className="analysis-empty-state" role="alert">
            <h2>분석 자료를 가져오지 못했어요.</h2>
            <p>연결 상태를 확인한 뒤 다시 분석해 주세요.</p>
          </div>
        ) : analysis ? (
          <>
            <p className="analysis-meta">
              전체 공개 회차 · {analysisResult?.drawCount ?? analysis.drawCount}
              회 반영 · {analysisResult?.latestRound ?? analysis.latestRound}
              회차 기준
            </p>
            <section
              className="analysis-section"
              aria-labelledby="frequency-title"
            >
              <div className="analysis-section-heading">
                <div>
                  <p className="analysis-card-eyebrow">NUMBER FREQUENCY</p>
                  <div className="frequency-title-row">
                    <h2 id="frequency-title">번호별 출현 횟수와 미출현 회차</h2>
                    <FrequencyGapHelp />
                  </div>
                </div>
                <span className="analysis-section-note">
                  {analysis.drawCount}회 기준
                </span>
              </div>
              <ul className="frequency-grid">
                {analysis.numberFrequencies.map(
                  ({ number, count, drawsSinceLastAppearance }) => (
                    <li
                      className="frequency-item"
                      key={number}
                      aria-label={`${number}번, 출현 ${count}회`}
                    >
                      <span
                        className={`frequency-ball lotto-ball-${getNumberTone(number)}`}
                        aria-hidden="true"
                      >
                        {number}
                      </span>
                      <strong>{count}회</strong>
                      <span className="frequency-gap">
                        {drawsSinceLastAppearance === null
                          ? "기록 없음"
                          : `${drawsSinceLastAppearance}회 미출현`}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </section>

            <div className="analysis-grid">
              <section
                className="analysis-section analysis-stat-card"
                aria-labelledby="odd-title"
              >
                <p className="analysis-card-eyebrow">ODD & EVEN</p>
                <h2 id="odd-title">홀짝 분포</h2>
                <ul className="distribution-list">
                  {analysis.oddCountDistribution.map((draws, oddCount) => (
                    <li key={oddCount}>
                      <span>
                        홀수 {oddCount} · 짝수 {6 - oddCount}
                      </span>
                      <strong>{draws}회</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                className="analysis-section analysis-stat-card"
                aria-labelledby="low-high-title"
              >
                <p className="analysis-card-eyebrow">LOW & HIGH</p>
                <h2 id="low-high-title">저수 1–22 · 고수 23–45</h2>
                <ul className="distribution-list">
                  {analysis.lowCountDistribution.map((lowCount, index) => (
                    <li key={index}>
                      <span>
                        저수 {index} · 고수 {6 - index}
                      </span>
                      <strong>{lowCount}회</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                className="analysis-section analysis-stat-card"
                aria-labelledby="bands-title"
              >
                <p className="analysis-card-eyebrow">NUMBER BANDS</p>
                <h2 id="bands-title">번호 구간 분포</h2>
                <ul className="band-list">
                  {analysis.numberBandCounts.map(({ start, end, count }) => (
                    <li key={start}>
                      <span>
                        {start}–{end}
                      </span>
                      <span className="band-track" aria-hidden="true">
                        <span
                          className="band-fill"
                          style={{
                            width: `${(count / (analysis.drawCount * 6)) * 100}%`,
                          }}
                        />
                      </span>
                      <strong>{count}회</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                className="analysis-section analysis-stat-card"
                aria-labelledby="consecutive-title"
              >
                <p className="analysis-card-eyebrow">CONSECUTIVE NUMBERS</p>
                <h2 id="consecutive-title">연속수 패턴</h2>
                <ul className="consecutive-list">
                  <li>
                    <span>연속수가 포함된 회차</span>
                    <strong>{analysis.consecutiveDrawCount}회</strong>
                  </li>
                  <li>
                    <span>연속된 수 쌍</span>
                    <strong>{analysis.consecutivePairCount}쌍</strong>
                  </li>
                  <li>
                    <span>최장 연속 길이</span>
                    <strong>{analysis.longestConsecutiveRun}개</strong>
                  </li>
                </ul>
              </section>
            </div>
          </>
        ) : (
          <div className="analysis-empty-state" role="status">
            <h2>실제 당첨 내역으로 이번 주 분석을 시작해 보세요.</h2>
            <p>
              분석하기를 누르면 공개된 회차 자료를 가져와 통계를 계산합니다.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
