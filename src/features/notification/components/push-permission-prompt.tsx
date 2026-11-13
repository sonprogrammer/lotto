"use client";

import { useFirstPushPrompt } from "../hooks/use-first-push-prompt";
import { usePushSubscription } from "../hooks/use-push-subscription";

export function PushPermissionPrompt({ isSignedIn }: { isSignedIn: boolean }) {
  const { dismiss, shouldShow } = useFirstPushPrompt(isSignedIn);
  const push = usePushSubscription();
  if (!shouldShow) return null;
  return (
    <aside
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
      aria-label="푸시 알림 안내"
    >
      <p className="font-semibold text-slate-900">
        저장한 번호의 당첨 결과를 알려드릴까요?
      </p>
      <p className="mt-1 text-sm text-slate-600">
        알림을 켜면 결과가 등록된 뒤 이 기기로 알려드려요.
      </p>
      {push.error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {push.error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          onClick={dismiss}
        >
          나중에
        </button>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          disabled={push.isPending}
          onClick={async () => {
            if (await push.enable()) dismiss();
          }}
        >
          {push.isPending ? "설정 중…" : "알림 켜기"}
        </button>
      </div>
    </aside>
  );
}
