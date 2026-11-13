import { getLottoNumberTone } from "@/shared/lib/get-lotto-number-tone";

type NumberBallSize = "picker" | "result" | "selected" | "compact";
type CommonProps = {
  number: number;
  size?: NumberBallSize;
  className?: string;
};
type DisplayProps = CommonProps & {
  onClick?: undefined;
  disabled?: never;
  selected?: never;
  label?: never;
};
type ButtonProps = CommonProps & {
  onClick: () => void;
  disabled?: boolean;
  selected: boolean;
  label?: string;
};

function getSizeClass(size: NumberBallSize) {
  if (size === "picker") return "aspect-square w-full max-w-12 text-sm";
  if (size === "selected") return "size-12 text-sm";
  if (size === "compact") return "size-8 text-xs";
  return "size-9 text-[13px]";
}

export function LottoNumberBall(props: DisplayProps | ButtonProps) {
  const { number, size = "result", className = "" } = props;
  const baseClassName = `lotto-number-ball grid shrink-0 place-items-center rounded-full border border-white/70 font-bold shadow-[inset_0_2px_4px_rgb(255_255_255_/_68%),inset_0_-3px_5px_rgb(34_47_66_/_13%),0_3px_7px_rgb(36_52_73_/_12%)] ${getSizeClass(size)} lotto-ball-${getLottoNumberTone(number)} ${className}`;

  if (props.onClick) {
    return (
      <button
        type="button"
        aria-label={props.label ?? `${number}번 선택`}
        aria-pressed={props.selected}
        disabled={props.disabled}
        onClick={props.onClick}
        className={`${baseClassName} cursor-pointer transition duration-150 hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:cursor-not-allowed disabled:opacity-45 ${props.selected ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
      >
        {number}
      </button>
    );
  }

  return <span className={baseClassName}>{number}</span>;
}
