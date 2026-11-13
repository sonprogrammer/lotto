"use client";

type Props = {
  numbers: number[];
  disabled?: boolean;
  onToggle: (number: number) => void;
};

function tone(number: number) {
  if (number <= 10) return "bg-amber-400 text-amber-950";
  if (number <= 20) return "bg-sky-400 text-sky-950";
  if (number <= 30) return "bg-rose-400 text-rose-950";
  if (number <= 40) return "bg-slate-300 text-slate-800";
  return "bg-emerald-400 text-emerald-950";
}

export function SavedNumberPicker({ numbers, disabled, onToggle }: Props) {
  return (
    <div
      className="grid grid-cols-9 gap-2 sm:grid-cols-[repeat(15,minmax(0,1fr))]"
      aria-label="번호 선택"
    >
      {Array.from({ length: 45 }, (_, index) => index + 1).map((number) => {
        const selected = numbers.includes(number);
        return (
          <button
            key={number}
            type="button"
            aria-label={`${number}번 번호 선택`}
            aria-pressed={selected}
            disabled={disabled || (!selected && numbers.length >= 6)}
            onClick={() => onToggle(number)}
            className={`aspect-square rounded-full text-sm font-semibold transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-45 ${tone(number)} ${selected ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
          >
            {number}
          </button>
        );
      })}
    </div>
  );
}
