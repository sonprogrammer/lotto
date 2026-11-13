"use client";

type Props = {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
};

export function SavedCombinationPagination({
  page,
  totalPages,
  disabled,
  onChange,
}: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav
      className="flex items-center justify-center gap-3 pt-2"
      aria-label="저장 조합 페이지 이동"
    >
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        이전
      </button>
      <span
        className="min-w-20 text-center text-sm text-slate-600"
        aria-live="polite"
      >
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        다음
      </button>
    </nav>
  );
}
