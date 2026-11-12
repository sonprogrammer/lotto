import type { GenerationResult } from "../hooks/use-generate-combinations";

type Props = { result: GenerationResult };

function constraintLabels(result: GenerationResult) {
  const constraints = result.appliedConstraints;
  const labels: string[] = [];
  if (constraints.fixedNumbers.length)
    labels.push(`고정 번호 ${constraints.fixedNumbers.join(", ")}`);
  if (constraints.excludedNumbers?.length)
    labels.push(`제외 번호 ${constraints.excludedNumbers.join(", ")}`);
  if (constraints.oddCount !== undefined)
    labels.push(`홀수 ${constraints.oddCount}개`);
  if (constraints.lowCount !== undefined)
    labels.push(`저수 ${constraints.lowCount}개`);
  if (
    constraints.minNumber !== undefined ||
    constraints.maxNumber !== undefined
  )
    labels.push(
      `번호 범위 ${constraints.minNumber ?? 1}–${constraints.maxNumber ?? 45}`,
    );
  if (constraints.allowConsecutive !== undefined)
    labels.push(
      constraints.allowConsecutive ? "연속 번호 허용" : "연속 번호 제외",
    );
  return labels.length ? labels : ["기본 통계 규칙"];
}

export function GenerationResults({ result }: Props) {
  const periodLabel =
    result.period.type === "all"
      ? "전체 회차"
      : `최근 ${result.period.count}회`;
  return (
    <section
      className="generation-results"
      role="region"
      aria-label="생성 결과"
      aria-live="polite"
    >
      <div className="generation-results-head">
        <div>
          <p className="analysis-card-eyebrow">YOUR COMBINATIONS</p>
          <h2>생성 결과</h2>
        </div>
        <span className="generation-round">{result.latestRound}회차 기준</span>
      </div>
      <p className="generation-result-meta">
        {periodLabel} · {result.period.firstRound}회부터{" "}
        {result.period.latestRound}회까지 · {result.period.drawCount}회 반영
      </p>
      <ol className="generation-combinations">
        {result.combinations.map(({ numbers }, index) => (
          <li
            className="generation-combination"
            key={`${result.seed}-${index}`}
          >
            <span className="generation-combination-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div
              role="group"
              className="generation-number-row"
              aria-label={`${index + 1}번 조합: ${numbers.join(", ")}`}
            >
              {numbers.map((number) => (
                <span className="generation-number" key={number}>
                  {number}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="generation-result-details">
        <div>
          <h3>적용된 조건</h3>
          <p>{constraintLabels(result).join(" · ")}</p>
        </div>
        <div>
          <h3>AI 설명</h3>
          <p>{result.explanation}</p>
        </div>
        {result.unsupportedConditions.length > 0 && (
          <div>
            <h3>반영하지 못한 조건</h3>
            <p>{result.unsupportedConditions.join(" · ")}</p>
          </div>
        )}
      </div>
      <p className="generation-disclaimer">
        과거 통계는 참고 자료이며 당첨을 예측하거나 보장하지 않아요.
      </p>
    </section>
  );
}
