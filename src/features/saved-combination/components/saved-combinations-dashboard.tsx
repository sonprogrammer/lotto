"use client";

import { SiteHeader } from "@/widgets/site-header";
import { ManualCombinationForm } from "./manual-combination-form";
import { SavedCombinationsPanel } from "./saved-combinations-panel";

type Props = { userId: string; displayName?: string };

export function SavedCombinationsDashboard({ userId, displayName }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-slate-50 pt-7 text-slate-950 lg:h-dvh lg:min-h-[40rem] lg:overflow-hidden">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-5 pb-5 pt-[58px] sm:px-8 lg:min-h-0 lg:pb-6 lg:pt-[58px]">
        <header className="shrink-0">
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-700">
            MY LOTTO
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight">
            저장한 번호
          </h1>
          <p className="mt-2 text-slate-600">
            직접 조합을 저장하거나, 생성한 번호를 나중에 확인할 수 있어요.
          </p>
        </header>
        <div className="grid items-start gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(21rem,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-6 lg:overflow-hidden xl:gap-8">
          <ManualCombinationForm userId={userId} />
          <SavedCombinationsPanel userId={userId} />
        </div>
      </div>
    </main>
  );
}
