"use client";

import { LottoNumberBall } from "@/shared/ui/lotto-number-ball";
import { useDailySajuRecommendation } from "../hooks/use-daily-saju-recommendation";

type Props = { userId: string; dateKey: string; hasBirthTime: boolean };

export function DailySajuCard({ userId, dateKey, hasBirthTime }: Props) {
  const recommendation = useDailySajuRecommendation(userId, dateKey, true);

  return (
    <section
      className="w-full rounded-[28px] border border-white bg-white/85 p-6 text-left shadow-[0_18px_50px_rgb(39_56_82_/_7%)] backdrop-blur sm:p-8"
      aria-labelledby="daily-saju-title"
    >
      <p className="text-xs font-bold tracking-[0.16em] text-slate-400">
        {dateKey} · 오늘의 운세
      </p>
      <h2
        id="daily-saju-title"
        className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
      >
        오늘의 사주 숫자
      </h2>
      {recommendation.isPending && (
        <div
          role="status"
          aria-label="오늘의 숫자를 불러오는 중"
          className="mt-6 animate-pulse"
        >
          <div className="mx-auto size-20 rounded-full bg-slate-100" />
          <div className="mx-auto mt-5 h-4 max-w-64 rounded-full bg-slate-100" />
          <p className="sr-only">오늘의 숫자를 불러오는 중</p>
        </div>
      )}
      {recommendation.data?.status === "generating" && (
        <p
          role="status"
          className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"
        >
          오늘의 숫자를 준비하고 있어요…
        </p>
      )}
      {recommendation.data?.status === "ready" &&
        recommendation.data.number !== undefined && (
          <div className="mt-6 flex flex-col items-center rounded-3xl bg-slate-50/80 px-5 py-7 text-center">
            <LottoNumberBall
              number={recommendation.data.number}
              size="selected"
            />
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-700">
              {recommendation.data.explanation}
            </p>
            {!hasBirthTime && (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                태어난 시간을 입력하지 않아 시주는 추천에 반영되지 않았어요.
              </p>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-400">
              재미를 위한 추천 숫자이며 당첨을 예측하거나 보장하지 않아요.
            </p>
          </div>
        )}
      {recommendation.isError && (
        <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
          <p>오늘의 숫자를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={() => void recommendation.refetch()}
            className="mt-3 rounded-full border border-rose-200 px-4 py-2 font-semibold transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          >
            다시 시도
          </button>
        </div>
      )}
    </section>
  );
}
