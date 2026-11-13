"use client";

import { useState } from "react";
import Link from "next/link";
import { useSaveCombination } from "../hooks/use-save-combination";
import { SavedNumberPicker } from "./saved-number-picker";

type Props = { userId: string };

export function ManualCombinationForm({ userId }: Props) {
  const save = useSaveCombination(userId);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [error, setError] = useState("");
  const toggle = (number: number) =>
    setNumbers((current) =>
      current.includes(number)
        ? current.filter((value) => value !== number)
        : [...current, number].sort((a, b) => a - b),
    );
  const submit = async () => {
    setError("");
    try {
      await save.mutateAsync({
        source: "manual",
        numbers: numbers as [number, number, number, number, number, number],
      });
      setNumbers([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "저장하지 못했어요.");
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">번호 직접 저장</h2>
          <p className="mt-1 text-sm text-slate-600">
            번호 6개를 고른 뒤 저장하세요.
          </p>
        </div>
        <Link
          href="/generate"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          AI 번호 생성하기
        </Link>
      </div>
      <div className="mt-6">
        <SavedNumberPicker
          numbers={numbers}
          disabled={save.isPending}
          onToggle={toggle}
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-600">선택 {numbers.length}/6</span>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={numbers.length !== 6 || save.isPending}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {save.isPending ? "저장 중…" : "조합 저장"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
    </section>
  );
}
