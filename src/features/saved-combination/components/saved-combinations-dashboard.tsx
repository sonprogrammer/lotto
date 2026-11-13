"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/widgets/site-header";
import { useSaveCombination } from "../hooks/use-save-combination";
import { useSavedCombinations } from "../hooks/use-saved-combinations";
import { useManageSavedCombinations } from "../hooks/use-manage-saved-combinations";
import { SavedCombinationCard } from "./saved-combination-card";
import { SavedNumberPicker } from "./saved-number-picker";

type Props = { userId: string; displayName?: string };

export function SavedCombinationsDashboard({ userId, displayName }: Props) {
  const query = useSavedCombinations(userId);
  const save = useSaveCombination(userId);
  const manage = useManageSavedCombinations(userId);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const toggle = (number: number) =>
    setNumbers((current) =>
      current.includes(number)
        ? current.filter((value) => value !== number)
        : [...current, number].sort((a, b) => a - b),
    );
  const items = query.data ?? [];
  const busy =
    save.isPending ||
    manage.update.isPending ||
    manage.remove.isPending ||
    manage.removeMany.isPending;
  const run = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
      return true;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "요청을 처리하지 못했어요.";
      setError(message);
      return false;
    }
  };
  const createManual = () =>
    void run(async () => {
      await save.mutateAsync({
        source: "manual",
        numbers: numbers as [number, number, number, number, number, number],
      });
      setNumbers([]);
    });
  const removeOne = (id: string) => {
    if (window.confirm("이 조합과 저장된 당첨 기록을 함께 삭제할까요?"))
      void run(async () => {
        await manage.remove.mutateAsync(id);
        setSelectedIds((current) => current.filter((value) => value !== id));
      });
  };
  const removeSelected = () => {
    if (
      selectedIds.length &&
      window.confirm(
        `선택한 ${selectedIds.length}개 조합과 당첨 기록을 삭제할까요?`,
      )
    )
      void run(async () => {
        await manage.removeMany.mutateAsync({ ids: selectedIds });
        setSelectedIds([]);
      });
  };
  const removeAll = () => {
    if (
      items.length &&
      window.confirm(
        `저장한 ${items.length}개 조합과 당첨 기록을 모두 삭제할까요?`,
      )
    )
      void run(async () => {
        await manage.removeMany.mutateAsync({ all: true });
        setSelectedIds([]);
      });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8">
        <header>
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-700">
            MY LOTTO
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            저장한 번호
          </h1>
          <p className="mt-2 text-slate-600">
            직접 조합을 저장하거나, 생성한 번호를 나중에 확인할 수 있어요.
          </p>
        </header>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
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
              disabled={busy}
              onToggle={toggle}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-600">
              선택 {numbers.length}/6
            </span>
            <button
              type="button"
              onClick={createManual}
              disabled={numbers.length !== 6 || busy}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {save.isPending ? "저장 중…" : "조합 저장"}
            </button>
          </div>
        </section>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              내 조합{" "}
              <span className="text-base font-normal text-slate-500">
                {items.length}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={removeSelected}
                disabled={!selectedIds.length || busy}
                className="rounded-full border border-slate-300 px-3 py-2 text-sm disabled:opacity-45"
              >
                선택 삭제 ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={removeAll}
                disabled={!items.length || busy}
                className="rounded-full border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-45"
              >
                전체 삭제
              </button>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800"
            >
              {error}
            </p>
          )}
          {query.isPending ? (
            <div role="status" aria-busy="true" className="space-y-3">
              <p className="sr-only">저장한 조합을 불러오는 중이에요.</p>
              {[1, 2].map((key) => (
                <div
                  key={key}
                  className="h-44 animate-pulse rounded-3xl bg-slate-200"
                />
              ))}
            </div>
          ) : query.isError ? (
            <div role="alert" className="rounded-3xl bg-white p-6">
              <p>저장한 번호를 불러오지 못했어요.</p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mt-3 text-sm font-semibold text-blue-700"
              >
                다시 시도
              </button>
            </div>
          ) : items.length ? (
            <div className="space-y-4">
              {items.map((item) => (
                <SavedCombinationCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  busy={busy}
                  onSelect={(id) =>
                    setSelectedIds((current) =>
                      current.includes(id)
                        ? current.filter((value) => value !== id)
                        : [...current, id],
                    )
                  }
                  onSave={(id, updatedNumbers) =>
                    run(() =>
                      manage.update.mutateAsync({
                        id,
                        numbers: updatedNumbers,
                      }),
                    )
                  }
                  onDelete={removeOne}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="font-semibold">아직 저장한 조합이 없어요</h3>
              <p className="mt-2 text-sm text-slate-600">
                번호를 직접 저장하거나 AI 번호 생성 페이지에서 원하는 조합을
                저장해 보세요.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
