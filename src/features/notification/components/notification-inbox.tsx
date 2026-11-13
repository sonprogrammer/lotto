"use client";

import Link from "next/link";
import { useState } from "react";
import { useNotifications } from "../hooks/use-notifications";
import { useManageNotification } from "../hooks/use-manage-notification";

export function NotificationInbox({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const query = useNotifications(userId, page);
  const markRead = useManageNotification(userId);
  if (query.isPending)
    return (
      <div className="space-y-3" aria-label="알림 불러오는 중">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  if (query.isError)
    return (
      <div className="rounded-2xl bg-rose-50 p-5 text-rose-800" role="alert">
        알림을 불러오지 못했어요.{" "}
        <button className="ml-2 underline" onClick={() => void query.refetch()}>
          다시 시도
        </button>
      </div>
    );
  if (!query.data?.items.length)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
        아직 도착한 알림이 없어요.
      </div>
    );
  return (
    <>
      <ul className="space-y-3">
        {query.data.items.map((item) => (
          <li
            key={item.id}
            className={`rounded-2xl border p-4 ${item.readAt ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/60"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {item.status === "corrected"
                    ? "당첨 결과가 정정됐어요"
                    : `${item.roundNumber}회차 ${item.rank}등 당첨`}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.drawDate.slice(0, 10)} ·{" "}
                  {item.status === "corrected"
                    ? "정정된 결과"
                    : `${item.amountPerWinner.toLocaleString("ko-KR")}원`}
                </p>
              </div>
              <Link
                href={`/saved?combinationId=${item.savedCombinationId}`}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-white"
                onClick={() => {
                  if (!item.readAt) markRead.mutate(item.id);
                }}
              >
                저장 조합 보기
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {query.data.totalPages > 1 && (
        <nav
          className="mt-5 flex items-center justify-center gap-4"
          aria-label="알림 페이지"
        >
          <button
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((current) => current - 1)}
          >
            이전
          </button>
          <span className="text-sm text-slate-600">
            {query.data.page} / {query.data.totalPages}
          </span>
          <button
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
            disabled={page >= query.data.totalPages || query.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            다음
          </button>
        </nav>
      )}
    </>
  );
}
