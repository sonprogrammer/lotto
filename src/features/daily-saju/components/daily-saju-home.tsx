"use client";

import { useState } from "react";
import type { SajuProfileInput } from "@/entities/user";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";
import { DailySajuCard } from "./daily-saju-card";
import { SajuProfileForm } from "./saju-profile-form";
import { useDeleteSajuProfile } from "../hooks/use-delete-saju-profile";
import { useSajuProfile } from "../hooks/use-saju-profile";
import { useSaveSajuProfile } from "../hooks/use-save-saju-profile";

type Props = {
  displayName?: string;
  userId: string;
  dateKey: string;
  isConfigured: boolean;
};

export function DailySajuHome({
  displayName,
  userId,
  dateKey,
  isConfigured,
}: Props) {
  const profileQuery = useSajuProfile(userId);
  const saveProfile = useSaveSajuProfile(userId);
  const deleteProfile = useDeleteSajuProfile(userId, dateKey);
  const [actionError, setActionError] = useState("");

  async function handleSave(input: SajuProfileInput) {
    setActionError("");
    try {
      await saveProfile.mutateAsync(input);
    } catch {
      setActionError(
        "사주 정보를 저장하지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.",
      );
    }
  }

  async function handleDelete() {
    setActionError("");
    try {
      await deleteProfile.mutateAsync();
    } catch {
      setActionError("사주 정보를 삭제하지 못했어요. 다시 시도해 주세요.");
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,rgb(255_255_255_/_96%),transparent_58%),linear-gradient(155deg,#f7f9fc_4%,#f1f4f9_100%)] px-4 py-5 sm:px-8 sm:py-7">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured={isConfigured}
        isSignedIn
      />
      <section
        className="flex w-full max-w-2xl flex-1 flex-col justify-center gap-5 py-10 sm:py-16"
        aria-label="오늘의 사주 추천"
      >
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-slate-400">
            매일, 한국 시간 기준
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            오늘의 행운 숫자
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
            사주 정보를 바탕으로 하루에 하나의 숫자를 추천해 드려요.
          </p>
        </div>
        {profileQuery.isPending && (
          <div
            role="status"
            aria-label="사주 정보를 불러오는 중"
            className="animate-pulse rounded-[28px] border border-white bg-white/80 p-8 shadow-sm"
          >
            <p className="sr-only">사주 정보를 불러오는 중</p>
            <div className="h-5 w-40 rounded-full bg-slate-100" />
            <div className="mt-5 h-24 rounded-2xl bg-slate-100" />
          </div>
        )}
        {profileQuery.isError && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-700">
              사주 정보를 불러오지 못했어요.
            </p>
            <button
              type="button"
              onClick={() => void profileQuery.refetch()}
              className="mt-4 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              다시 시도
            </button>
          </div>
        )}
        {profileQuery.data && (
          <>
            <SajuProfileForm
              profile={profileQuery.data.profile}
              onSave={handleSave}
              onDelete={handleDelete}
              isSaving={saveProfile.isPending}
              isDeleting={deleteProfile.isPending}
              error={actionError}
            />
            {profileQuery.data.profile && (
              <DailySajuCard
                userId={userId}
                dateKey={dateKey}
                hasBirthTime={Boolean(profileQuery.data.profile.birthTime)}
              />
            )}
          </>
        )}
      </section>
      <p className="pb-1 text-center text-xs text-slate-400">
        사주 추천은 재미를 위한 참고 정보예요.
      </p>
    </main>
  );
}
