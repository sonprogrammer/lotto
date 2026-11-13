"use client";

import Link from "next/link";
import { useState } from "react";
import { useSaveGeneratedCombination } from "../hooks/use-save-generated-combination";

type Props = { userId: string; numbers: number[]; analysisSummary: string };

export function SaveGeneratedCombination({
  userId,
  numbers,
  analysisSummary,
}: Props) {
  const save = useSaveGeneratedCombination(userId);
  const [saved, setSaved] = useState(false);
  const saveNumbers = () =>
    void save
      .mutateAsync({
        source: "ai-assisted",
        numbers: numbers as [number, number, number, number, number, number],
        analysisSummary,
      })
      .then(() => setSaved(true))
      .catch(() => undefined);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={save.isPending || saved}
        onClick={saveNumbers}
        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {save.isPending ? "저장 중…" : saved ? "저장 완료" : "이 조합 저장"}
      </button>
      {saved && (
        <Link href="/saved" className="text-sm font-semibold text-blue-700">
          저장한 번호 보기
        </Link>
      )}
      {save.isError && (
        <span role="alert" className="text-sm text-rose-700">
          저장하지 못했어요. 다시 시도해 주세요.
        </span>
      )}
    </div>
  );
}
