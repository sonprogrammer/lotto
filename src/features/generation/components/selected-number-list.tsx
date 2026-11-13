import { LottoNumberBall } from "@/shared/ui/lotto-number-ball";

type Props = {
  numbers: number[];
  disabled: boolean;
  onRemove: (number: number) => void;
};

export function SelectedNumberList({ numbers, disabled, onRemove }: Props) {
  return (
    <section
      className="generation-selected-numbers"
      aria-label="선택한 번호"
      role="region"
    >
      <div className="generation-selected-heading">
        <h2>선택한 번호</h2>
        <span>{numbers.length}/6</span>
      </div>
      {numbers.length > 0 ? (
        <ul>
          {numbers.map((number) => (
            <li className="generation-selected-item" key={number}>
              <LottoNumberBall number={number} size="selected" />
              <button
                className="generation-selected-remove"
                type="button"
                aria-label={`${number}번 선택 취소`}
                disabled={disabled}
                onClick={() => onRemove(number)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>번호를 선택하면 여기에 표시돼요.</p>
      )}
    </section>
  );
}
