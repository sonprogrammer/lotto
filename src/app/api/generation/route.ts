import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { GenerationRequestSchema } from "@/features/generation/model/generation-request";
import {
  GenerationInputError,
  runGeneration,
} from "@/features/generation/server/run-generation";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "생성 요청을 확인해 주세요." },
      { status: 400 },
    );
  }
  const parsed = GenerationRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "생성 요청을 확인해 주세요." },
      { status: 400 },
    );

  try {
    return NextResponse.json(await runGeneration(parsed.data));
  } catch (error) {
    if (error instanceof GenerationInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: "생성 자료를 가져오지 못했어요. 다시 시도해 주세요.",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
