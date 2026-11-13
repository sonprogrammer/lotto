"use client";

import { useState } from "react";

import { SiteHeader } from "@/widgets/site-header";
import { useRunWeeklyAnalysis } from "../hooks/use-run-weekly-analysis";
import type { AnalysisPeriod } from "../model/analysis-period";
import { AnalysisPeriodSelector } from "./analysis-period-selector";
import { FrequencyGapHelp } from "./frequency-gap-help";

type AnalysisDashboardProps = {
  displayName?: string;
  userId: string;
};

function getNumberTone(number: number) {
  if (number <= 10) return "gold";
  if (number <= 20) return "blue";
  if (number <= 30) return "red";
  if (number <= 40) return "gray";
  return "green";
}

export function AnalysisDashboard({
  displayName,
  userId,
}: AnalysisDashboardProps) {
  const [period, setPeriod] = useState<AnalysisPeriod>({
    type: "recent",
    count: 30,
  });
  const analysisRequest = useRunWeeklyAnalysis(period);
  const [customCount, setCustomCount] = useState("");
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [hasRequestedCurrentPeriod, setHasRequestedCurrentPeriod] =
    useState(false);
  const [knownAvailableDrawCount, setKnownAvailableDrawCount] = useState<
    number | undefined
  >();
  const analysisResult = hasRequestedCurrentPeriod
    ? analysisRequest.data
    : undefined;
  const analysis = analysisResult?.analysis;
  const availableDrawCount =
    analysisResult?.availableDrawCount ?? knownAvailableDrawCount;

  function resetAnalysisAnd<T>(update: (value: T) => void) {
    return (value: T) => {
      if (analysisResult) {
        setKnownAvailableDrawCount(analysisResult.availableDrawCount);
      }
      setHasRequestedCurrentPeriod(false);
      update(value);
    };
  }

  async function runAnalysis() {
    setHasRequestedCurrentPeriod(true);
    try {
      const result = await analysisRequest.run();
      setKnownAvailableDrawCount(result.availableDrawCount);
    } catch {
      // The query exposes the error state for the current period.
    }
  }

  return (
    <main className="analysis-shell">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
      <section className="analysis-content" aria-labelledby="analysis-title">
        <p className="analysis-eyebrow">LOTTO 6/45 · 데이터 기반 분석</p>
        <h1 id="analysis-title">이번 주 분석</h1>
        <p className="analysis-intro">
          공개된 과거 당첨 번호를 정해진 기준으로 살펴봅니다.
          <br />
          분석은 참고 자료이며 당첨을 예측하거나 보장하지 않아요.
        </p>

        <AnalysisPeriodSelector
          period={period}
          onChange={resetAnalysisAnd(setPeriod)}
          customCount={customCount}
          onCustomCountChange={resetAnalysisAnd(setCustomCount)}
          isCustom={isCustomPeriod}
          onCustomModeChange={resetAnalysisAnd(setIsCustomPeriod)}
          availableDrawCount={availableDrawCount}
        />

        <button
          className="analysis-run-button"
          type="button"
          disabled={
            analysisRequest.isFetching ||
            (isCustomPeriod &&
              (!/^[1-9]\d*$/.test(customCount) ||
                !Number.isSafeInteger(Number(customCount)) ||
                (availableDrawCount !== undefined &&
                  Number(customCount) > availableDrawCount)))
          }
          onClick={() => void runAnalysis()}
        >
          {analysisRequest.isFetching
            ? "분석 중"
            : analysisRequest.isError
              ? "다시 분석하기"
              : "분석하기"}
        </button>

        {analysisRequest.isFetching ? (
          <div
            className="analysis-loading-state"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <p>
              선택한 기간의 회차 자료를 확인하고 있어요. 처음 조회할 때는 잠시
              걸릴 수 있어요.
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
        ) : !hasRequestedCurrentPeriod ? (
          <p className="analysis-empty-state">
            선택한 기간으로 분석을 실행해 결과를 확인해 주세요.
          </p>
        ) : analysisRequest.isError ? (
          <div className="analysis-empty-state" role="alert">
            <h2>분석 자료를 가져오지 못했어요.</h2>
            <p>
              {analysisRequest.error.message ||
                "연결 상태를 확인한 뒤 다시 분석해 주세요."}
            </p>
          </div>
        ) : analysis ? (
          <>
            <p className="analysis-meta">
              {analysisResult?.period.type === "all"
                ? "전체"
                : `최근 ${analysisResult?.period.count ?? (period.type === "recent" ? period.count : analysis.drawCount)}회`}
              {analysisResult?.period.firstRound !== null &&
              analysisResult?.period.firstRound !== undefined
                ? ` · ${analysisResult.period.firstRound}회부터`
                : ""}
              {analysisResult?.period.latestRound !== null &&
              analysisResult?.period.latestRound !== undefined
                ? ` ${analysisResult.period.latestRound}회까지 · ${analysisResult.period.drawCount}회 반영 · ${analysisResult.period.latestRound}회차 기준`
                : ` · ${analysisResult?.period.drawCount ?? analysis.drawCount}회 반영`}
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
                          ? `${analysisResult?.period.type === "all" ? "전체" : `최근 ${analysisResult?.period.count ?? analysis.drawCount}회`} 내 미출현`
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
