import { NextResponse } from "next/server";
import { listLotteryDraws, syncLotteryDraws } from "@/entities/lottery-draw";
import { calculateWeeklyAnalysis } from "@/features/analysis";
import { getCurrentUser } from "@/features/auth/server/current-session";

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  try {
    await syncLotteryDraws();
    const draws = await listLotteryDraws();
    const analysis = calculateWeeklyAnalysis(draws);
    if (analysis.latestRound === null) {
      throw new Error(
        "No lottery draw history was available after synchronization",
      );
    }
    return NextResponse.json({
      analysis,
      drawCount: analysis.drawCount,
      latestRound: analysis.latestRound,
    });
  } catch {
    return NextResponse.json(
      { error: "분석 자료를 가져오지 못했어요." },
      { status: 502 },
    );
  }
}
