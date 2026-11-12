"use client";

import { SiteHeader } from "@/widgets/site-header";
import { useGenerationForm } from "../hooks/use-generation-form";
import { GenerationResults } from "./generation-results";
import "./generation.css";

type Props = { displayName?: string };
export function GenerationDashboard({ displayName }: Props) {
  const {
    method,
    fixedNumbers,
    count,
    periodChoice,
    customCount,
    prompt,
    generation,
    customPeriodValid,
    fixedValid,
    countValid,
    canSubmit,
    changeMethod,
    toggleNumber,
    changeCount,
    changePeriodChoice,
    changeCustomCount,
    changePrompt,
    submit,
    retry,
  } = useGenerationForm();

  return (
    <main className="analysis-shell">
      <SiteHeader displayName={displayName} isConfigured isSignedIn />
      <div className="analysis-content generation-content">
        <p className="analysis-eyebrow">LOTTO 6/45 · NUMBER STUDIO</p>
        <h1>나만의 번호 조합</h1>
        <p className="analysis-intro">
          과거 당첨 통계를 참고해 원하는 조건으로 조합을 만드세요.
          <br />
          결과는 참고용이며 당첨을 예측하지 않아요.
        </p>
        <form className="generation-form" onSubmit={submit}>
          <fieldset className="generation-fieldset">
            <legend>생성 방법</legend>
            <div className="generation-methods">
              {(
                [
                  ["automatic", "자동 생성", "통계 기반으로 조합을 만듭니다."],
                  [
                    "selected",
                    "선택 번호 포함",
                    "고른 번호를 모든 조합에 포함합니다.",
                  ],
                  [
                    "ai-assisted",
                    "AI 추천",
                    "고른 번호와 AI 조건을 함께 반영합니다.",
                  ],
                ] as const
              ).map(([value, label, description]) => (
                <label className="generation-method" key={value}>
                  <input
                    type="radio"
                    name="method"
                    value={value}
                    aria-label={label}
                    checked={method === value}
                    onChange={() => changeMethod(value)}
                  />
                  <strong>{label}</strong>
                  <span>{description}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {method !== "automatic" && (
            <fieldset className="generation-fieldset">
              <legend>
                고정 번호{" "}
                <span className="generation-hint">
                  {method === "ai-assisted" ? "1~5개" : "1~6개"} 선택
                </span>
              </legend>
              <p className="generation-helper">
                선택한 번호는 생성된 모든 조합에 들어갑니다.
              </p>
              <div className="generation-picker">
                {Array.from({ length: 45 }, (_, index) => index + 1).map(
                  (number) => (
                    <button
                      type="button"
                      key={number}
                      aria-label={`${number}번 고정`}
                      aria-pressed={fixedNumbers.includes(number)}
                      disabled={
                        !fixedNumbers.includes(number) &&
                        fixedNumbers.length >=
                          (method === "ai-assisted" ? 5 : 6)
                      }
                      onClick={() => toggleNumber(number)}
                    >
                      {number}
                    </button>
                  ),
                )}
              </div>
              {!fixedValid && (
                <p className="generation-validation" role="alert">
                  {method === "ai-assisted"
                    ? "AI 추천에는 번호 1~5개를 선택해 주세요."
                    : "번호를 1개 이상 선택해 주세요."}
                </p>
              )}
            </fieldset>
          )}
          <div className="generation-settings">
            <div className="generation-control">
              <label htmlFor="generation-count">생성 개수</label>
              <select
                id="generation-count"
                value={count}
                onChange={(event) => changeCount(Number(event.target.value))}
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (value) => (
                    <option value={value} key={value}>
                      {value}개
                    </option>
                  ),
                )}
              </select>
              {!countValid && (
                <p className="generation-validation" role="alert">
                  번호 6개를 고정하면 1개 조합만 만들 수 있어요.
                </p>
              )}
            </div>
            <div className="generation-control">
              <label htmlFor="generation-period">분석 기간</label>
              <select
                id="generation-period"
                value={periodChoice}
                onChange={(event) => changePeriodChoice(event.target.value)}
              >
                <option value="all">전체</option>
                {[10, 15, 20, 30].map((value) => (
                  <option value={`recent:${value}`} key={value}>
                    최근 {value}회
                  </option>
                ))}
                <option value="custom">직접 입력</option>
              </select>
              {periodChoice === "custom" && (
                <>
                  <label className="sr-only" htmlFor="generation-custom-period">
                    직접 입력 회차
                  </label>
                  <input
                    id="generation-custom-period"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={customCount}
                    onChange={(event) => changeCustomCount(event.target.value)}
                  />
                  {!customPeriodValid && (
                    <p className="generation-validation" role="alert">
                      1회 이상의 정수를 입력해 주세요.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="generation-control generation-prompt">
            <label htmlFor="generation-prompt">
              AI에게 전할 조건{" "}
              <span className="generation-hint">선택 사항</span>
            </label>
            <textarea
              id="generation-prompt"
              maxLength={500}
              value={prompt}
              onChange={(event) => changePrompt(event.target.value)}
              placeholder="예: 홀수 3개를 포함해 주세요"
              rows={3}
            />
            <p className="generation-helper">
              지원되는 조건만 반영합니다. {prompt.length}/500자
            </p>
          </div>
          <button
            className="generation-submit"
            type="submit"
            disabled={!canSubmit}
          >
            {generation.isPending ? "생성 중" : "조합 생성하기"}
          </button>
        </form>
        {generation.isPending ? (
          <div
            className="generation-loading"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <p>선택한 기간을 분석하고 조합을 만드는 중이에요.</p>
            <div className="generation-skeleton generation-skeleton-heading" />
            {Array.from({ length: Math.min(count, 5) }, (_, index) => (
              <div
                className="generation-skeleton generation-skeleton-row"
                key={index}
              />
            ))}
          </div>
        ) : generation.isError ? (
          <div className="generation-feedback" role="alert">
            <h2>조합을 만들지 못했어요</h2>
            <p>{generation.error.message}</p>
            <button type="button" onClick={retry}>
              다시 시도하기
            </button>
          </div>
        ) : generation.data ? (
          <GenerationResults result={generation.data} />
        ) : (
          <p className="generation-feedback">
            조건을 고르고 조합 생성하기를 눌러 주세요.
          </p>
        )}
      </div>
    </main>
  );
}
