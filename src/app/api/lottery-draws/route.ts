import { NextResponse } from "next/server";
import { listLotteryDrawsPage } from "@/entities/lottery-draw";
import { getCurrentUser } from "@/features/auth/server/current-session";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const cursorParam = params.get("cursor");
  const pageSizeParam = params.get("limit");
  const beforeRound = cursorParam === null ? undefined : Number(cursorParam);
  const pageSize =
    pageSizeParam === null ? DEFAULT_PAGE_SIZE : Number(pageSizeParam);

  if (
    (beforeRound !== undefined &&
      (!Number.isInteger(beforeRound) || beforeRound < 1)) ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE
  ) {
    return NextResponse.json(
      { error: "조회 범위가 올바르지 않아요." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await listLotteryDrawsPage({ beforeRound, pageSize }),
    );
  } catch {
    return NextResponse.json(
      { error: "당첨 내역을 불러오지 못했어요." },
      { status: 500 },
    );
  }
}
