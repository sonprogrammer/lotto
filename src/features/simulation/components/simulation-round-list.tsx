import type { SimulationRun } from "@/entities/simulation";
import { LottoNumberBall } from "@/shared/ui/lotto-number-ball";

type Props = { run: SimulationRun };

const currency = new Intl.NumberFormat("ko-KR");
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

export function SimulationRoundList({ run }: Props) {
  const rounds = [...run.rounds].sort(
    (left, right) => right.roundNumber - left.roundNumber,
  );

  return (
    <section aria-labelledby="simulation-rounds-title" className="mt-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          ROUND BY ROUND
        </p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
          id="simulation-rounds-title"
        >
          회차별 결과
        </h2>
      </div>
      <ul className="mt-4 space-y-3">
        {rounds.map((round, index) => {
          const hits = round.combinations.filter(
            ({ rank }) => rank !== null,
          ).length;
          return (
            <li
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              key={round.roundNumber}
            >
              <details className="group" open={index === 0}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-4 marker:hidden sm:px-5">
                  <span>
                    <strong className="text-sm font-semibold text-slate-900">
                      {round.roundNumber}회차 결과
                    </strong>
                    <span className="ml-2 text-xs text-slate-500">
                      {dateFormatter.format(new Date(round.drawDate))}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {hits > 0 ? `당첨 ${hits}개` : "당첨 없음"} · 통계{" "}
                    {round.analysisFirstRound}~{round.analysisLatestRound}회
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-xs font-medium text-slate-500">
                    실제 당첨 번호
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {round.winningNumbers.map((number) => (
                      <LottoNumberBall
                        key={number}
                        number={number}
                        size="compact"
                      />
                    ))}
                    <span className="mx-1 text-xs text-slate-400">보너스</span>
                    <LottoNumberBall
                      number={round.bonusNumber}
                      size="compact"
                    />
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-500">
                    생성 조합 · 회차 직전 30회차 전 통계로 생성
                  </p>
                  <ul className="mt-2 space-y-2">
                    {round.combinations.map((combination, combinationIndex) => (
                      <li
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
                        key={`${round.roundNumber}-${combination.numbers.join("-")}`}
                      >
                        <span className="sr-only">
                          {combinationIndex + 1}번 조합
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {combination.numbers.map((number) => (
                            <LottoNumberBall
                              key={number}
                              number={number}
                              size="compact"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          {combination.rank === null
                            ? "미당첨"
                            : `${combination.rank}등 · ${combination.amountPerWinner === null ? "당첨금 자료 없음" : `${currency.format(combination.amountPerWinner)}원`}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
