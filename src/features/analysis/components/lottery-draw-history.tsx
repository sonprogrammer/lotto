"use client";

import Link from "next/link";
import { SiteHeader } from "@/widgets/site-header";
import { DrawHistoryCard } from "./draw-history-card";
import { useLotteryDrawHistory } from "../hooks/use-lottery-draw-history";
import { useLotterySyncStatus } from "../hooks/use-lottery-sync-status";
import { useManualLotterySync } from "../hooks/use-manual-lottery-sync";
import { LotterySyncStatus } from "./lottery-sync-status";

type LotteryDrawHistoryProps = {
  displayName?: string;
  userId: string;
};

export function LotteryDrawHistory({
  displayName,
  userId,
}: LotteryDrawHistoryProps) {
  const query = useLotteryDrawHistory();
  const syncStatus = useLotterySyncStatus();
  const manualSync = useManualLotterySync();
  const draws =
    query.data?.pages.flatMap(({ draws: pageDraws }) => pageDraws) ?? [];

  return (
    <main className="history-shell">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
      <section className="history-content" aria-labelledby="history-title">
        <p className="analysis-eyebrow">LOTTO 6/45 · DRAW HISTORY</p>
        <h1 id="history-title">회차별 당첨 내역</h1>
        <p className="analysis-intro">
          현재까지 공개된 회차의 당첨 번호와 등위별 당첨 정보를 확인할 수
          있어요.
        </p>

        <LotterySyncStatus
          status={syncStatus.data}
          isPending={syncStatus.isPending}
          isError={syncStatus.isError}
          onRetry={() => void syncStatus.refetch()}
          isSyncing={manualSync.isPending}
          syncMessage={manualSync.message}
          syncErrorMessage={manualSync.errorMessage}
          onSync={manualSync.sync}
        />

        {query.isPending ? (
          <div className="history-skeleton-list" role="status" aria-busy="true">
            <span className="visually-hidden">
              당첨 내역을 불러오고 있어요.
            </span>
            {Array.from({ length: 4 }, (_, index) => (
              <div className="history-skeleton-card" key={index} />
            ))}
          </div>
        ) : query.isError && draws.length === 0 ? (
          <div className="analysis-empty-state" role="alert">
            <h2>당첨 내역을 불러오지 못했어요.</h2>
            <p>연결 상태를 확인한 뒤 다시 불러와 주세요.</p>
            <button
              className="analysis-run-button"
              type="button"
              onClick={() => void query.refetch()}
            >
              다시 불러오기
            </button>
          </div>
        ) : draws.length === 0 ? (
          <div className="analysis-empty-state" role="status">
            <h2>아직 저장된 회차 내역이 없어요.</h2>
            <p>
              이번 주 분석 화면에서 분석하기를 누르면 당첨 내역을 가져옵니다.
            </p>
            <Link className="analysis-retry-link" href="/analysis">
              이번 주 분석으로 이동
            </Link>
          </div>
        ) : (
          <>
            <p className="analysis-meta">최신 회차부터 {draws.length}회 표시</p>
            <ul className="draw-history-list">
              {draws.map((draw) => (
                <DrawHistoryCard draw={draw} key={draw.roundNumber} />
              ))}
            </ul>
            {query.isFetchNextPageError && (
              <div className="history-inline-error" role="alert">
                <span>이전 회차를 불러오지 못했어요.</span>
                <button
                  type="button"
                  onClick={() => void query.fetchNextPage()}
                >
                  다시 불러오기
                </button>
              </div>
            )}
            {query.hasNextPage && (
              <button
                className="history-more-button"
                type="button"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "불러오는 중" : "이전 회차 더 보기"}
              </button>
            )}
            {query.isFetchingNextPage && (
              <div
                className="history-inline-skeleton"
                role="status"
                aria-busy="true"
              >
                이전 회차를 불러오고 있어요.
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
