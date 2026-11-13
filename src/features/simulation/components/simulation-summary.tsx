import type { SimulationRunSummary } from "@/entities/simulation";

type Props = { run: SimulationRunSummary };

const currency = new Intl.NumberFormat("ko-KR");

export function SimulationSummary({ run }: Props) {
  const knownPayout = currency.format(run.totals.knownPayoutTotal);
  const cost = currency.format(run.totals.totalCost);
  const net = currency.format(Math.abs(run.totals.netKnownPayout));

  return (
    <section aria-labelledby="simulation-summary-title" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            SIMULATION SUMMARY
          </p>
          <h2
            className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
            id="simulation-summary-title"
          >
            최근 30회차 비교
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          {run.settings.targetRoundCount}회차 · 회차당{" "}
          {run.settings.combinationsPerRound}조합 ·{" "}
          {run.totals.combinationsEvaluated}개 대조
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="총 구매 비용" value={`${cost}원`} />
        <Metric label="확인된 총 당첨금" value={`${knownPayout}원`} />
        <Metric
          label="확인 금액 기준 차액"
          value={`${run.totals.netKnownPayout < 0 ? "−" : "+"}${net}원`}
        />
      </dl>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-800">
          등수별 당첨 조합
        </h3>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {run.totals.hitsByRank.map(({ rank, count }) => (
            <li
              className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600"
              key={rank}
            >
              <span>{rank}등</span>
              <strong className="ml-2 text-slate-900">{count}개</strong>
            </li>
          ))}
        </ul>
        {run.totals.unknownPayoutCount > 0 && (
          <p className="mt-3 text-xs leading-5 text-amber-800">
            당첨금 자료가 확인되지 않은 조합 {run.totals.unknownPayoutCount}개는
            당첨금 합계에서 제외했어요.
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-500">
          조합당 1,000원으로 비용을 계산했어요. 확인 금액 기준 차액은 자료가
          있는 당첨금에서 전체 구매 비용을 뺀 값이에요.
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-lg font-semibold tabular-nums tracking-tight text-slate-900">
        {value}
      </dd>
    </div>
  );
}
