import type { AnalysisPeriod } from "../model/analysis-period";

type AnalysisPeriodSelectorProps = {
  period: AnalysisPeriod;
  onChange: (period: AnalysisPeriod) => void;
  customCount: string;
  onCustomCountChange: (value: string) => void;
  isCustom: boolean;
  onCustomModeChange: (isCustom: boolean) => void;
  availableDrawCount?: number;
};

const presetCounts = [10, 15, 20, 30];

export function AnalysisPeriodSelector({
  period,
  onChange,
  customCount,
  onCustomCountChange,
  isCustom,
  onCustomModeChange,
  availableDrawCount,
}: AnalysisPeriodSelectorProps) {
  const value = period.type === "all" ? "all" : `recent:${period.count}`;

  return (
    <div className="analysis-period-control">
      <label className="analysis-period-label" htmlFor="analysis-period">
        분석 기간
      </label>
      <select
        className="analysis-period-select"
        id="analysis-period"
        value={isCustom ? "custom" : value}
        onChange={(event) => {
          if (event.target.value === "all") {
            onCustomModeChange(false);
            onChange({ type: "all" });
          } else if (event.target.value === "custom") {
            onCustomModeChange(true);
            const count = Number(customCount);
            if (Number.isInteger(count) && count > 0)
              onChange({ type: "recent", count });
          } else {
            onCustomModeChange(false);
            onCustomCountChange("");
            onChange({
              type: "recent",
              count: Number(event.target.value.split(":")[1]),
            });
          }
        }}
      >
        <option value="all">전체</option>
        {presetCounts.map((count) => (
          <option key={count} value={`recent:${count}`}>
            최근 {count}회
          </option>
        ))}
        <option value="custom">직접 입력</option>
      </select>
      {isCustom ? (
        <div className="analysis-period-custom">
          <label className="sr-only" htmlFor="analysis-period-custom-count">
            직접 입력 회차
          </label>
          <input
            className="analysis-period-input"
            id="analysis-period-custom-count"
            type="number"
            inputMode="numeric"
            min="1"
            max={availableDrawCount}
            step="1"
            value={customCount}
            onChange={(event) => {
              const value = event.target.value;
              onCustomCountChange(value);
              const count = Number(value);
              if (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(count)) {
                onChange({ type: "recent", count });
              }
            }}
          />
          <span>회</span>
          {availableDrawCount !== undefined &&
          Number(customCount) > availableDrawCount ? (
            <span className="analysis-period-error" role="alert">
              보유한 {availableDrawCount}회 이내로 입력해 주세요.
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
