"use client";

import { SiteHeader } from "@/widgets/site-header";
import { ManualCombinationForm } from "./manual-combination-form";
import { SavedCombinationsPanel } from "./saved-combinations-panel";

type Props = { userId: string; displayName?: string };

export function SavedCombinationsDashboard({ userId, displayName }: Props) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader
        displayName={displayName}
        userId={userId}
        isConfigured
        isSignedIn
      />
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8">
        <header>
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-700">
            MY LOTTO
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            저장한 번호
          </h1>
          <p className="mt-2 text-slate-600">
            직접 조합을 저장하거나, 생성한 번호를 나중에 확인할 수 있어요.
          </p>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(21rem,0.9fr)_minmax(0,1.1fr)] xl:gap-8">
          <ManualCombinationForm userId={userId} />
          <SavedCombinationsPanel userId={userId} />
        </div>
      </div>
    </main>
  );
}
