type Props = {
  combinationsPerRound: number;
  isPending: boolean;
  onCountChange: (count: number) => void;
  onRun: () => void;
};

export function SimulationControls({
  combinationsPerRound,
  isPending,
  onCountChange,
  onRun,
}: Props) {
  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_16px_48px_rgb(31_52_78_/_7%)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            설정
          </p>
          <label
            className="mt-3 block text-sm font-semibold text-slate-800"
            htmlFor="simulation-count"
          >
            회차당 조합 수
          </label>
          <select
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 sm:w-36"
            disabled={isPending}
            id="simulation-count"
            value={combinationsPerRound}
            onChange={(event) => onCountChange(Number(event.target.value))}
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map(
              (count) => (
                <option key={count} value={count}>
                  {count}개
                </option>
              ),
            )}
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            최근 완료 30회차마다 같은 개수로 조합을 만들어요.
          </p>
        </div>
        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          disabled={isPending}
          onClick={onRun}
          type="button"
        >
          {isPending ? "시뮬레이션 계산 중" : "시뮬레이션 실행"}
        </button>
      </div>
      <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
        매 회차 직전 30회 통계만 사용해 과거 결과를 재현해요.
      </p>
    </section>
  );
}
