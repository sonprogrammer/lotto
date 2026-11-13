"use client";

import { useState } from "react";
import { useManageSavedCombinations } from "../hooks/use-manage-saved-combinations";
import { useSavedCombinations } from "../hooks/use-saved-combinations";
import { SavedCombinationCard } from "./saved-combination-card";
import { SavedCombinationPagination } from "./saved-combination-pagination";

type Props = { userId: string };

export function SavedCombinationsPanel({ userId }: Props) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const query = useSavedCombinations(userId, page);
  const manage = useManageSavedCombinations(userId);
  const data = query.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const totalLabel = data ? total : query.isPending ? "…" : "—";
  const busy =
    manage.update.isPending ||
    manage.remove.isPending ||
    manage.removeMany.isPending;

  const run = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "요청을 처리하지 못했어요.",
      );
      return false;
    }
  };
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
      total &&
      window.confirm(`저장한 ${total}개 조합과 당첨 기록을 모두 삭제할까요?`)
    )
      void run(async () => {
        await manage.removeMany.mutateAsync({ all: true });
        setSelectedIds([]);
        setPage(1);
      });
  };

  return (
    <section
      className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      aria-labelledby="saved-combinations-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="saved-combinations-heading" className="text-xl font-semibold">
            저장한 조합{" "}
            <span className="text-base font-normal text-slate-500">
              {totalLabel}
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            조합을 선택해 수정하거나 삭제할 수 있어요.
          </p>
        </div>
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
            disabled={!total || busy}
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
      {query.isPending && !data ? (
        <div role="status" aria-busy="true" className="space-y-3">
          <p className="sr-only">저장한 조합을 불러오는 중이에요.</p>
          {[1, 2].map((key) => (
            <div
              key={key}
              className="h-44 animate-pulse rounded-3xl bg-slate-200"
            />
          ))}
        </div>
      ) : query.isError && !data ? (
        <div role="alert" className="rounded-3xl bg-slate-50 p-6">
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
        <>
          <div className="space-y-3" aria-busy={busy}>
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
                onSave={(id, numbers) =>
                  run(() => manage.update.mutateAsync({ id, numbers }))
                }
                onDelete={removeOne}
              />
            ))}
          </div>
          <SavedCombinationPagination
            page={data?.page ?? page}
            totalPages={totalPages}
            disabled={busy}
            onChange={setPage}
          />
          {query.isFetching && (
            <p className="text-center text-xs text-slate-500" role="status">
              목록을 불러오는 중이에요.
            </p>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <h3 className="font-semibold">아직 저장한 조합이 없어요</h3>
          <p className="mt-2 text-sm text-slate-600">
            번호를 직접 저장하거나 AI 번호 생성 페이지에서 원하는 조합을 저장해
            보세요.
          </p>
        </div>
      )}
    </section>
  );
}
