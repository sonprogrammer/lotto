"use client";

import { LottoNumberBall } from "@/shared/ui/lotto-number-ball";

type Props = {
  numbers: number[];
  disabled?: boolean;
  onToggle: (number: number) => void;
};

export function SavedNumberPicker({ numbers, disabled, onToggle }: Props) {
  return (
    <div
      className="grid grid-cols-5 gap-2 sm:grid-cols-9 lg:grid-cols-5 xl:grid-cols-6"
      aria-label="번호 선택"
    >
      {Array.from({ length: 45 }, (_, index) => index + 1).map((number) => {
        const selected = numbers.includes(number);
        return (
          <LottoNumberBall
            key={number}
            number={number}
            size="picker"
            label={`${number}번 번호 선택`}
            selected={selected}
            disabled={disabled || (!selected && numbers.length >= 6)}
            onClick={() => onToggle(number)}
          />
        );
      })}
    </div>
  );
}
