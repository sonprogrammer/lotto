import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { LOTTERY_DRAW_HISTORY_CACHE_TAG } from "@/entities/lottery-draw";
import { syncAndReconcileSavedCombinationDrawResults } from "@/entities/saved-combination";
import { WEEKLY_ANALYSIS_CACHE_TAG } from "@/features/analysis";
import { getCurrentUser } from "@/features/auth/server/current-session";

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  try {
    const result = await syncAndReconcileSavedCombinationDrawResults({
      maxAttempts: 1,
    });

    if (result.changed) {
      revalidateTag(WEEKLY_ANALYSIS_CACHE_TAG, { expire: 0 });
      revalidateTag(LOTTERY_DRAW_HISTORY_CACHE_TAG, { expire: 0 });
    }

    return NextResponse.json({
      changed: result.changed,
      latestRound: result.latestRound,
    });
  } catch {
    return NextResponse.json(
      {
        error: "당첨 번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      },
      { status: 502 },
    );
  }
}
