"use client";

import { SiteHeader } from "@/widgets/site-header";
import { useSavedPrompts } from "@/features/saved-prompt/hooks/use-saved-prompts";
import { useGenerationForm } from "../hooks/use-generation-form";
import { GenerationResults } from "./generation-results";
import { GenerationPromptControl } from "./generation-prompt-control";
import { SelectedNumberList } from "./selected-number-list";
import "./generation.css";

type Props = { displayName?: string; userId: string };

function getNumberTone(number: number) {
  if (number <= 10) return "gold";
  if (number <= 20) return "blue";
  if (number <= 30) return "red";
  if (number <= 40) return "gray";
  return "green";
}

export function GenerationDashboard({ displayName, userId }: Props) {
  const savedPromptsQuery = useSavedPrompts(userId);
  const savedPrompts = savedPromptsQuery.data ?? [];
  const {
    fixedNumbers,
    count,
    periodChoice,
    customCount,
    prompt,
    promptMode,
    savedPromptId,
    generation,
    customPeriodValid,
    countValid,
    canSubmit,
    toggleNumber,
    changeCount,
    changePeriodChoice,
    changeCustomCount,
    changePrompt,
    changePromptMode,
    changeSavedPromptId,
    submit,
    retry,
  } = useGenerationForm(savedPrompts);

  return (
    <main className="analysis-shell">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
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
            <legend>
              고정 번호 <span className="generation-hint">0~6개 선택</span>
            </legend>
            <p className="generation-helper">
              선택한 번호는 생성된 모든 조합에 들어갑니다. 번호를 고르지 않아도
              조합을 만들 수 있어요.
            </p>
            <div className="generation-picker">
              {Array.from({ length: 45 }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    type="button"
                    key={number}
                    aria-label={`${number}번 고정`}
                    aria-pressed={fixedNumbers.includes(number)}
                    className={`generation-ball lotto-ball-${getNumberTone(number)}`}
                    disabled={
                      generation.isPending ||
                      (!fixedNumbers.includes(number) &&
                        fixedNumbers.length >= 6)
                    }
                    onClick={() => toggleNumber(number)}
                  >
                    {number}
                  </button>
                ),
              )}
            </div>
            <SelectedNumberList
              numbers={fixedNumbers}
              disabled={generation.isPending}
              onRemove={toggleNumber}
            />
          </fieldset>
          <div className="generation-settings">
            <div className="generation-control">
              <label htmlFor="generation-count">생성 개수</label>
              <select
                id="generation-count"
                disabled={generation.isPending}
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
                disabled={generation.isPending}
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
                    disabled={generation.isPending}
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
          <GenerationPromptControl
            mode={promptMode}
            prompt={prompt}
            savedPromptId={savedPromptId}
            savedPrompts={savedPrompts}
            isLoading={savedPromptsQuery.isPending}
            isError={savedPromptsQuery.isError}
            disabled={generation.isPending}
            onModeChange={changePromptMode}
            onPromptChange={changePrompt}
            onSavedPromptChange={changeSavedPromptId}
            onRetry={() => void savedPromptsQuery.refetch()}
          />
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
            번호나 의견을 추가하지 않아도 조합 생성하기를 눌러 만들 수 있어요.
          </p>
        )}
      </div>
    </main>
  );
}
