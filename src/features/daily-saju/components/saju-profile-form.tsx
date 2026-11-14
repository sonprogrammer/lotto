"use client";

import { useState, type FormEvent } from "react";
import type { SajuProfile, SajuProfileInput } from "@/entities/user";
import { ConfirmationDialog } from "@/shared/ui/confirmation-dialog";

type Props = {
  profile: SajuProfile | null;
  onSave: (input: SajuProfileInput) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string;
};

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/10";

export function SajuProfileForm({
  profile,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  error,
}: Props) {
  const [isEditing, setIsEditing] = useState(!profile);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? "");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">(
    profile?.calendarType ?? "solar",
  );
  const [isLeapMonth, setLeapMonth] = useState(profile?.isLeapMonth ?? false);
  const [birthTime, setBirthTime] = useState(profile?.birthTime ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: SajuProfileInput = {
      ...(displayName.trim() && { displayName: displayName.trim() }),
      birthDate,
      calendarType,
      ...(calendarType === "lunar" && { isLeapMonth }),
      ...(birthTime && { birthTime }),
    };
    setLocalError("");
    try {
      await onSave(input);
      setIsEditing(false);
    } catch {
      setLocalError(
        "사주 정보를 저장하지 못했어요. 입력한 내용을 확인해 주세요.",
      );
    }
  }

  if (profile && !isEditing) {
    return (
      <section
        className="w-full rounded-[28px] border border-white bg-white/85 p-6 text-left shadow-[0_18px_50px_rgb(39_56_82_/_7%)] backdrop-blur sm:p-8"
        aria-labelledby="saju-profile-title"
      >
        <p className="text-xs font-bold tracking-[0.16em] text-slate-400">
          내 사주 정보
        </p>
        <h2
          id="saju-profile-title"
          className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
        >
          {profile.displayName || "등록한 프로필"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {profile.birthDate} ·{" "}
          {profile.calendarType === "solar" ? "양력" : "음력"}
          {profile.calendarType === "lunar" && profile.isLeapMonth && " · 윤달"}
          {profile.birthTime
            ? ` · ${profile.birthTime}`
            : " · 태어난 시간 미입력"}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          정보를 수정해도 오늘 이미 받은 추천은 유지되고, 내일부터 바뀐 정보가
          적용돼요.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            정보 수정
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            사주 정보 삭제
          </button>
        </div>
        <ConfirmationDialog
          open={isDeleteOpen}
          title="사주 정보를 삭제할까요?"
          description="저장된 오늘의 추천 기록도 함께 삭제돼요."
          confirmLabel="삭제하기"
          isDestructive
          isPending={isDeleting}
          error={localError || error}
          onConfirm={async () => {
            try {
              await onDelete();
              setDisplayName("");
              setBirthDate("");
              setCalendarType("solar");
              setLeapMonth(false);
              setBirthTime("");
              setIsEditing(true);
              setDeleteOpen(false);
            } catch {
              setLocalError(
                "사주 정보를 삭제하지 못했어요. 다시 시도해 주세요.",
              );
            }
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      </section>
    );
  }

  return (
    <section
      className="w-full rounded-[28px] border border-white bg-white/85 p-6 text-left shadow-[0_18px_50px_rgb(39_56_82_/_7%)] backdrop-blur sm:p-8"
      aria-labelledby="saju-profile-title"
    >
      <p className="text-xs font-bold tracking-[0.16em] text-slate-400">
        오늘의 사주 추천
      </p>
      <h2
        id="saju-profile-title"
        className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
      >
        사주 정보를 입력해 주세요
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        매일 한국 시간 기준으로 오늘의 숫자 하나를 추천해 드려요. 이름은
        선택이고, 태어난 시간은 몰라도 괜찮아요.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <label className="text-sm font-medium text-slate-700">
          이름 (선택)
          <input
            className={fieldClassName}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={30}
            autoComplete="name"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          태어난 날짜
          <input
            className={fieldClassName}
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          달력 기준
          <select
            className={fieldClassName}
            value={calendarType}
            onChange={(event) => {
              const value = event.target.value as "solar" | "lunar";
              setCalendarType(value);
              if (value === "solar") setLeapMonth(false);
            }}
          >
            <option value="solar">양력</option>
            <option value="lunar">음력</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          태어난 시간 (선택)
          <input
            className={fieldClassName}
            type="time"
            value={birthTime}
            onChange={(event) => setBirthTime(event.target.value)}
          />
        </label>
        {calendarType === "lunar" && (
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={isLeapMonth}
              onChange={(event) => setLeapMonth(event.target.checked)}
              className="size-4 accent-slate-900"
            />
            윤달
          </label>
        )}
        {(error || localError) && (
          <p
            role="alert"
            className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-800 sm:col-span-2"
          >
            {localError || error}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2">
          {profile && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-60"
          >
            {isSaving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </form>
    </section>
  );
}
