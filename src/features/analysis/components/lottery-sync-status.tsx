import Link from "next/link";
import type { LotterySyncStatusResponse } from "../hooks/use-lottery-sync-status";

type LotterySyncStatusProps = {
  status?: LotterySyncStatusResponse;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function LotterySyncStatus({
  status,
  isPending,
  isError,
  onRetry,
}: LotterySyncStatusProps) {
  if (isPending) {
    return (
      <div
        className="mb-6 h-24 animate-pulse rounded-2xl bg-slate-200/70"
        role="status"
        aria-busy="true"
      >
        <span className="sr-only">동기화 상태를 불러오고 있어요.</span>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <section
        className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4"
        role="alert"
      >
        <p className="font-medium">갱신 상태를 확인하지 못했어요.</p>
        <button
          className="mt-2 text-sm underline"
          type="button"
          onClick={onRetry}
        >
          다시 확인
        </button>
      </section>
    );
  }

  return (
    <section
      className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:p-5"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-1 size-2.5 shrink-0 rounded-full ${getStatusDotClass(status.state)}`}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">당첨 번호 자동 갱신</h2>
          <p className="mt-1 text-sm text-slate-600">
            {getStatusMessage(status)}
          </p>
          {status.state === "failed" && (
            <p className="mt-2 text-sm text-slate-600">
              분석 화면에서 분석하기를 누르면 다시 확인할 수 있어요. 이전에
              반영된 자료는 유지됩니다.
              <Link className="ml-1 underline" href="/analysis">
                분석 화면으로 이동
              </Link>
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            다음 확인 예정: {formatKoreanDate(status.nextExpectedAt)}쯤 · 공개와
            반영 시각은 달라질 수 있어요.
          </p>
        </div>
      </div>
    </section>
  );
}

function getStatusMessage(status: LotterySyncStatusResponse): string {
  if (status.state === "running") {
    return status.lastSuccessAt
      ? `당첨 결과를 확인하고 있어요 · 마지막 성공 ${formatKoreanDate(status.lastSuccessAt)}`
      : "당첨 결과를 확인하고 있어요.";
  }
  if (status.state === "failed") {
    return status.lastSuccessAt
      ? `최근 ${status.latestRound ?? ""}회까지 반영 · 마지막 성공 ${formatKoreanDate(status.lastSuccessAt)}`
      : "아직 성공적으로 반영된 결과가 없어요.";
  }
  if (status.lastSuccessAt) {
    return `최근 ${status.latestRound}회까지 반영 · 마지막 성공 ${formatKoreanDate(status.lastSuccessAt)}`;
  }
  return "첫 자동 갱신을 기다리는 중이에요.";
}

function getStatusDotClass(state: LotterySyncStatusResponse["state"]): string {
  if (state === "failed") return "bg-red-500";
  if (state === "running") return "bg-amber-500";
  if (state === "success") return "bg-emerald-500";
  return "bg-slate-400";
}

function formatKoreanDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
