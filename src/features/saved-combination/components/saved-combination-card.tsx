"use client";

import { useState } from "react";
import type { SavedCombination } from "@/entities/saved-combination/model/combination";
import { LottoNumberBall } from "@/shared/ui/lotto-number-ball";
import { SavedNumberPicker } from "./saved-number-picker";

type Props = {
  item: SavedCombination;
  selected: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onSave: (id: string, numbers: number[]) => Promise<boolean>;
  onDelete: (id: string) => void;
  highlighted?: boolean;
};

export function SavedCombinationCard({
  item,
  selected,
  busy,
  onSelect,
  onSave,
  onDelete,
  highlighted = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [numbers, setNumbers] = useState<number[]>(item.numbers);
  const toggle = (number: number) =>
    setNumbers((current) =>
      current.includes(number)
        ? current.filter((value) => value !== number)
        : [...current, number].sort((a, b) => a - b),
    );
  const title = item.source === "manual" ? "직접 저장" : "AI 추천 저장";
  const comparisonHelpId = `comparison-start-help-${item.id}`;
  const latestResult = item.drawResults.reduce<
    (typeof item.drawResults)[number] | null
  >(
    (latest, result) =>
      !latest || result.roundNumber > latest.roundNumber ? result : latest,
    null,
  );
  return (
    <article
      id={`saved-combination-${item.id}`}
      className={`rounded-2xl border p-3.5 shadow-sm transition sm:p-4 ${highlighted ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 text-sm font-semibold">
          <label className="flex min-w-0 items-center gap-2.5">
            <input
              type="checkbox"
              checked={selected}
              disabled={busy}
              onChange={() => onSelect(item.id)}
              aria-label={`${item.numbers.join(", ")} 선택`}
            />
            {title}
          </label>
          <span className="truncate text-xs font-normal text-slate-500">
            {item.trackingStartRound}회차부터 비교
          </span>
          <span className="group relative inline-flex shrink-0">
            <button
              type="button"
              aria-label="비교 시작 회차 안내"
              aria-describedby={comparisonHelpId}
              className="inline-flex size-4 items-center justify-center rounded-full border border-slate-400 text-[10px] font-medium text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              ?
            </button>
            <span
              id={comparisonHelpId}
              role="tooltip"
              className="invisible absolute left-1/2 top-full z-10 mt-2 w-52 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-normal leading-5 text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              저장 시점의 최신 회차 다음부터 비교해요.
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            disabled={busy}
            onClick={() => {
              if (!editing) setNumbers(item.numbers);
              setEditing((value) => !value);
            }}
          >
            {editing ? "닫기" : "수정"}
          </button>
          <button
            type="button"
            className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            disabled={busy}
            onClick={() => onDelete(item.id)}
          >
            삭제
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mt-5 space-y-4">
          <SavedNumberPicker
            numbers={numbers}
            disabled={busy}
            onToggle={toggle}
          />
          <p className="text-sm text-slate-600">
            선택 {numbers.length}/6 · 변경한 번호는 다음 회차부터 비교해요.
          </p>
          <button
            type="button"
            disabled={busy || numbers.length !== 6}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() =>
              void onSave(item.id, numbers).then((saved) => {
                if (saved) setEditing(false);
              })
            }
          >
            변경 저장
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.numbers.map((number) => (
            <LottoNumberBall key={number} number={number} size="compact" />
          ))}
        </div>
      )}
      {item.analysisSummary && (
        <details className="mt-2.5 text-xs text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-500">
            AI 설명 보기
          </summary>
          <p className="mt-2 rounded-xl bg-slate-50 p-3 leading-5">
            {item.analysisSummary}
          </p>
        </details>
      )}
      <section className="mt-3 border-t border-slate-100 pt-2.5">
        {latestResult ? (
          <>
            <p className="text-xs text-slate-600">
              <span className="mr-1.5 font-semibold text-slate-500">
                최근 결과
              </span>
              {latestResult.roundNumber}회 ·{" "}
              {latestResult.rank
                ? `${latestResult.rank}등 · ${latestResult.amountPerWinner.toLocaleString()}원`
                : "미당첨"}
            </p>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-500">
                당첨 확인 이력 {item.drawResults.length}회
              </summary>
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-2.5">
                {item.drawResults
                  .slice()
                  .reverse()
                  .map((result) => (
                    <li
                      key={result.roundNumber}
                      className="flex flex-wrap justify-between gap-x-3"
                    >
                      <span>
                        {result.roundNumber}회 ·{" "}
                        {new Date(result.drawDate).toLocaleDateString("ko-KR")}
                      </span>
                      <span>
                        {result.rank
                          ? `${result.rank}등 · ${result.amountPerWinner.toLocaleString()}원`
                          : "미당첨"}
                      </span>
                    </li>
                  ))}
              </ul>
            </details>
          </>
        ) : (
          <p className="text-xs text-slate-500">다음 추첨 결과부터 확인해요.</p>
        )}
      </section>
    </article>
  );
}
