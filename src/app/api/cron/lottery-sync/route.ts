import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  LOTTERY_DRAW_HISTORY_CACHE_TAG,
  runLotteryDrawSync,
} from "@/entities/lottery-draw";
import { WEEKLY_ANALYSIS_CACHE_TAG } from "@/features/analysis";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runLotteryDrawSync({ maxAttempts: 3 });
    if (result.changed) {
      revalidateTag(WEEKLY_ANALYSIS_CACHE_TAG, { expire: 0 });
      revalidateTag(LOTTERY_DRAW_HISTORY_CACHE_TAG, { expire: 0 });
    }
    return NextResponse.json({
      success: true,
      changed: result.changed,
      latestRound: result.latestRound,
    });
  } catch {
    return NextResponse.json(
      { error: "Lottery result sync failed" },
      { status: 502 },
    );
  }
}
