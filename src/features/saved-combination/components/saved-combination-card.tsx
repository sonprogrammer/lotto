"use client";

import { useState } from "react";
import type { SavedCombination } from "@/entities/saved-combination/model/combination";
import { SavedNumberPicker } from "./saved-number-picker";

type Props = {
  item: SavedCombination;
  selected: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onSave: (id: string, numbers: number[]) => Promise<boolean>;
  onDelete: (id: string) => void;
};

export function SavedCombinationCard({
  item,
  selected,
  busy,
  onSelect,
  onSave,
  onDelete,
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
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <label className="flex items-center gap-3 font-semibold">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(item.id)}
            aria-label={`${item.numbers.join(", ")} 선택`}
          />
          {title}
          <span className="text-xs font-normal text-slate-500">
            {item.trackingStartRound}회차부터 비교
          </span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
            onClick={() => {
              if (!editing) setNumbers(item.numbers);
              setEditing((value) => !value);
            }}
          >
            {editing ? "닫기" : "수정"}
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm text-rose-700 hover:bg-rose-50"
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
        <div className="mt-4 flex flex-wrap gap-2">
          {item.numbers.map((number) => (
            <span
              key={number}
              className="grid size-10 place-items-center rounded-full bg-slate-100 font-semibold"
            >
              {number}
            </span>
          ))}
        </div>
      )}
      {item.analysisSummary && (
        <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          {item.analysisSummary}
        </p>
      )}
      <section className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="font-semibold">당첨 확인</h3>
        {item.drawResults.length ? (
          <ul className="mt-2 space-y-2">
            {item.drawResults
              .slice()
              .reverse()
              .map((result) => (
                <li
                  key={result.roundNumber}
                  className="flex flex-wrap justify-between gap-x-4 text-sm text-slate-600"
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
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            다음 추첨 결과부터 확인해요.
          </p>
        )}
      </section>
    </article>
  );
}
