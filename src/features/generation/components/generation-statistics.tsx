import type { GenerationStatisticsSummary } from "../model/generation-statistics-summary";

type Props = { summary: GenerationStatisticsSummary };

export function GenerationStatistics({ summary }: Props) {
  return (
    <section className="generation-statistics" aria-label="분석 통계 요약">
      <h3>분석 통계 요약</h3>
      <p>선택한 분석 기간에서 집계한 번호별 상위 5개 통계예요.</p>
      <h4>자주 출현한 번호</h4>
      {summary.mostFrequentNumbers.length > 0 ? (
        <ol>
          {summary.mostFrequentNumbers.map(({ number, count }) => (
            <li key={number}>
              {number}번 · {count}회 출현
            </li>
          ))}
        </ol>
      ) : (
        <p>선택 기간에 출현한 번호가 없어요.</p>
      )}
      <h4>오래 미출현한 번호</h4>
      <p>
        선택 기간의 마지막 회차까지 나오지 않은 회차 수이며, 한 번도 나오지 않은
        번호는 제외해요.
      </p>
      {summary.longestCurrentAbsences.length > 0 ? (
        <ol>
          {summary.longestCurrentAbsences.map(
            ({ number, drawsSinceLastAppearance }) => (
              <li key={number}>
                {number}번 · {drawsSinceLastAppearance}회째 미출현
              </li>
            ),
          )}
        </ol>
      ) : (
        <p>선택 기간에 미출현 회차를 계산할 번호가 없어요.</p>
      )}
    </section>
  );
}
