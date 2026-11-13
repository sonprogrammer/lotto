"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/widgets/site-header";
import { SimulationApiError } from "../api/simulation-api";
import { useCreateSimulation } from "../hooks/use-create-simulation";
import { useSimulationRun } from "../hooks/use-simulation-run";
import { useSimulationRuns } from "../hooks/use-simulation-runs";
import { SimulationControls } from "./simulation-controls";
import { SimulationRoundList } from "./simulation-round-list";
import { SimulationSummary } from "./simulation-summary";

type Props = { displayName?: string; userId: string };

export function SimulationDashboard({ displayName, userId }: Props) {
  const [combinationsPerRound, setCombinationsPerRound] = useState(5);
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const runsQuery = useSimulationRuns(userId);
  const runs = runsQuery.data ?? [];
  const activeRunId = selectedRunId ?? runs[0]?.id;
  const runQuery = useSimulationRun(userId, activeRunId);
  const createMutation = useCreateSimulation(userId);

  function startSimulation() {
    createMutation.mutate(combinationsPerRound, {
      onSuccess: (run) => setSelectedRunId(run.id),
    });
  }
  const canRetrySimulation =
    !(createMutation.error instanceof SimulationApiError) ||
    createMutation.error.retryable;

  return (
    <main className="analysis-shell">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
      <section
        aria-labelledby="simulation-title"
        className="analysis-content pb-16"
      >
        <p className="analysis-eyebrow">LOTTO 6/45 · 과거 기록 검증</p>
        <h1 className="text-balance" id="simulation-title">
          과거 회차 시뮬레이션
        </h1>
        <p className="analysis-intro">
          매 회차 직전의 통계만으로 조합을 만들고 실제 당첨 결과와 비교해요.
          <br />
          과거 결과는 미래 당첨을 예측하거나 당첨 확률을 높여 주지 않아요.
        </p>

        <SimulationControls
          combinationsPerRound={combinationsPerRound}
          isPending={createMutation.isPending}
          onCountChange={setCombinationsPerRound}
          onRun={startSimulation}
        />

        {createMutation.isSuccess && createMutation.data && (
          <p
            aria-live="polite"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            시뮬레이션 결과를 저장했어요. 아래에서 회차별 결과를 확인해 보세요.
          </p>
        )}

        {createMutation.isPending && (
          <div
            aria-busy="true"
            aria-live="polite"
            className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
            role="status"
          >
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
            </div>
          </div>
        )}

        {createMutation.isError && (
          <div
            className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
            role="alert"
          >
            <p className="font-semibold">시뮬레이션을 실행하지 못했어요.</p>
            <p className="mt-1">{createMutation.error.message}</p>
            {canRetrySimulation ? (
              <button
                className="mt-3 min-h-10 rounded-lg border border-rose-300 bg-white px-3 font-medium"
                onClick={startSimulation}
                type="button"
              >
                다시 시도하기
              </button>
            ) : (
              <Link
                className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-rose-300 bg-white px-3 font-medium"
                href="/history"
              >
                회차별 당첨 내역 확인
              </Link>
            )}
          </div>
        )}

        {runsQuery.isPending && !runsQuery.data ? (
          <div
            aria-busy="true"
            className="mt-8 animate-pulse space-y-3"
            role="status"
          >
            <div className="h-7 w-48 rounded bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-100" />
          </div>
        ) : runsQuery.isError && !runsQuery.data ? (
          <div
            className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900"
            role="alert"
          >
            <p className="font-semibold">
              저장된 시뮬레이션을 불러오지 못했어요.
            </p>
            <button
              className="mt-3 min-h-10 rounded-lg border border-rose-300 bg-white px-3 font-medium"
              onClick={() => void runsQuery.refetch()}
              type="button"
            >
              다시 불러오기
            </button>
          </div>
        ) : runs.length === 0 ? (
          !createMutation.isPending && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center">
              <h2 className="text-base font-semibold text-slate-800">
                저장된 시뮬레이션이 없어요.
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                조합 수를 고르고 실행하면 결과가 여기에 저장돼요.
              </p>
            </div>
          )
        ) : (
          <>
            <section aria-label="저장된 시뮬레이션" className="mt-8">
              <label
                className="block text-sm font-semibold text-slate-800"
                htmlFor="simulation-run-select"
              >
                저장된 결과
              </label>
              <select
                className="mt-2 min-h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                id="simulation-run-select"
                value={activeRunId}
                onChange={(event) => setSelectedRunId(event.target.value)}
              >
                {runs.map((savedRun) => (
                  <option key={savedRun.id} value={savedRun.id}>
                    {new Intl.DateTimeFormat("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(savedRun.createdAt))}
                    {` · ${savedRun.baseLatestRound}회차 기준 · ${savedRun.settings.combinationsPerRound}조합`}
                  </option>
                ))}
              </select>
            </section>
          </>
        )}

        {activeRunId && runQuery.isPending ? (
          <div
            aria-busy="true"
            className="mt-6 animate-pulse space-y-3"
            role="status"
          >
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-64 rounded-2xl bg-slate-100" />
          </div>
        ) : activeRunId && runQuery.isError && !runQuery.data ? (
          <div
            className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
            role="alert"
          >
            <p>이 시뮬레이션 결과를 불러오지 못했어요.</p>
            <button
              className="mt-3 min-h-10 rounded-lg border border-rose-300 bg-white px-3 font-medium"
              onClick={() => void runQuery.refetch()}
              type="button"
            >
              다시 불러오기
            </button>
          </div>
        ) : runQuery.data ? (
          <>
            <SimulationSummary run={runQuery.data} />
            <SimulationRoundList run={runQuery.data} />
          </>
        ) : null}
      </section>
    </main>
  );
}
