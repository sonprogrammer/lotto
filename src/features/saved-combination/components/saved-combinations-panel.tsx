"use client";

import { useState } from "react";
import { ConfirmationDialog } from "@/shared/ui/confirmation-dialog";
import { useManageSavedCombinations } from "../hooks/use-manage-saved-combinations";
import { useSavedCombinations } from "../hooks/use-saved-combinations";
import { SavedCombinationCard } from "./saved-combination-card";
import { SavedCombinationPagination } from "./saved-combination-pagination";

type Props = { userId: string };
type DeleteTarget =
  | { type: "one"; id: string }
  | { type: "selected"; ids: string[] }
  | { type: "all"; count: number };

export function SavedCombinationsPanel({ userId }: Props) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const query = useSavedCombinations(userId, page);
  const manage = useManageSavedCombinations(userId);
  const data = query.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const totalLabel = data ? total : query.isPending ? "…" : "—";
  const isDeleting = manage.remove.isPending || manage.removeMany.isPending;
  const busy = manage.update.isPending || isDeleting;

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      if (deleteTarget.type === "one") {
        await manage.remove.mutateAsync(deleteTarget.id);
        setSelectedIds((current) =>
          current.filter((id) => id !== deleteTarget.id),
        );
      } else if (deleteTarget.type === "selected") {
        await manage.removeMany.mutateAsync({ ids: deleteTarget.ids });
        setSelectedIds([]);
      } else {
        await manage.removeMany.mutateAsync({ all: true });
        setSelectedIds([]);
        setPage(1);
      }
      setDeleteTarget(null);
    } catch (cause) {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : "삭제하지 못했어요. 다시 시도해 주세요.",
      );
    }
  };

  const deleteDialog = deleteTarget
    ? {
        title:
          deleteTarget.type === "one"
            ? "이 조합을 삭제할까요?"
            : deleteTarget.type === "selected"
              ? `선택한 ${deleteTarget.ids.length}개 조합을 삭제할까요?`
              : `저장한 ${deleteTarget.count}개 조합을 모두 삭제할까요?`,
        description:
          "조합과 연결된 당첨 확인 이력도 함께 삭제되며, 삭제한 내용은 복구할 수 없어요.",
      }
    : { title: "", description: "" };

  return (
    <>
      <section
        className="min-w-0 space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden"
        aria-labelledby="saved-combinations-heading"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="saved-combinations-heading"
              className="text-lg font-semibold"
            >
              저장한 조합{" "}
              <span className="text-sm font-normal text-slate-500">
                {totalLabel}
              </span>
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              조합을 선택해 수정하거나 삭제할 수 있어요.
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!selectedIds.length) return;
                setDeleteError("");
                setDeleteTarget({ type: "selected", ids: [...selectedIds] });
              }}
              disabled={!selectedIds.length || busy}
              className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-45"
            >
              선택 삭제 ({selectedIds.length})
            </button>
            <button
              type="button"
              onClick={() => {
                if (!total) return;
                setDeleteError("");
                setDeleteTarget({ type: "all", count: total });
              }}
              disabled={!total || busy}
              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-45"
            >
              전체 삭제
            </button>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="shrink-0 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800"
          >
            {error}
          </p>
        )}
        {query.isPending && !data ? (
          <div
            role="status"
            aria-busy="true"
            className="min-h-0 space-y-3 lg:flex-1"
          >
            <p className="sr-only">저장한 조합을 불러오는 중이에요.</p>
            {[1, 2].map((key) => (
              <div
                key={key}
                className="h-32 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : query.isError && !data ? (
          <div role="alert" className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm">저장한 번호를 불러오지 못했어요.</p>
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
            <div
              className="space-y-2.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2"
              aria-busy={busy}
            >
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
                  onDelete={(id) => {
                    setDeleteError("");
                    setDeleteTarget({ type: "one", id });
                  }}
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
              <p
                className="shrink-0 text-center text-xs text-slate-500"
                role="status"
              >
                목록을 불러오는 중이에요.
              </p>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center lg:min-h-0 lg:flex-1 lg:content-center">
            <h3 className="text-sm font-semibold">아직 저장한 조합이 없어요</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              번호를 직접 저장하거나 AI 번호 생성 페이지에서 원하는 조합을
              저장해 보세요.
            </p>
          </div>
        )}
      </section>
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title={deleteDialog.title}
        description={deleteDialog.description}
        confirmLabel="삭제"
        isDestructive
        isPending={isDeleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
