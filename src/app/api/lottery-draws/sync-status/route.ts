import { NextResponse } from "next/server";
import {
  getLotterySyncStatus,
  getNextLotterySyncAt,
} from "@/entities/lottery-draw";
import { getCurrentUser } from "@/features/auth/server/current-session";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  try {
    const status = await getLotterySyncStatus();
    return NextResponse.json({
      ...status,
      lastAttemptAt: status.lastAttemptAt?.toISOString() ?? null,
      lastSuccessAt: status.lastSuccessAt?.toISOString() ?? null,
      nextExpectedAt: getNextLotterySyncAt(new Date()).toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "동기화 상태를 불러오지 못했어요." },
      { status: 500 },
    );
  }
}
