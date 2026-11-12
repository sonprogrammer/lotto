import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  LOTTERY_DRAW_HISTORY_CACHE_TAG,
  syncLotteryDraws,
} from "@/entities/lottery-draw";
import {
  AnalysisPeriodSchema,
  getCachedWeeklyAnalysis,
  WEEKLY_ANALYSIS_CACHE_TAG,
} from "@/features/analysis";
import { getCurrentUser } from "@/features/auth/server/current-session";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "분석 기간을 확인해 주세요." },
      { status: 400 },
    );
  }

  const periodResult = AnalysisPeriodSchema.safeParse(
    (body as { period?: unknown } | null)?.period,
  );
  if (!periodResult.success) {
    return NextResponse.json(
      { error: "분석 기간을 확인해 주세요." },
      { status: 400 },
    );
  }

  try {
    const syncResult = await syncLotteryDraws();
    if (
      periodResult.data.type === "recent" &&
      periodResult.data.count > syncResult.drawCount
    ) {
      return NextResponse.json(
        { error: "최근 회차 수보다 큰 기간은 선택할 수 없어요." },
        { status: 400 },
      );
    }

    if (syncResult.changed) {
      revalidateTag(WEEKLY_ANALYSIS_CACHE_TAG, { expire: 0 });
      revalidateTag(LOTTERY_DRAW_HISTORY_CACHE_TAG, { expire: 0 });
    }

    const result = await getCachedWeeklyAnalysis(
      syncResult.latestRound,
      syncResult.latestDrawVersion,
      periodResult.data,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "분석 자료를 가져오지 못했어요." },
      { status: 502 },
    );
  }
}
