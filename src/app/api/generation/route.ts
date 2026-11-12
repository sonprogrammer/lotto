import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { GenerationRequestSchema } from "@/features/generation/model/generation-request";
import {
  GenerationInputError,
  runGeneration,
} from "@/features/generation/server/run-generation";
import { GroqProviderError } from "@/features/generation/server/groq-recommendation";

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
    if (error instanceof GroqProviderError) {
      if (error.kind === "rate-limit") {
        return NextResponse.json(
          {
            error: "AI 사용 한도에 도달했어요. 잠시 후 다시 시도해 주세요.",
            retryable: true,
          },
          { status: 429 },
        );
      }
      if (error.kind === "timeout") {
        return NextResponse.json(
          {
            error: "AI 응답 시간이 초과됐어요. 다시 시도해 주세요.",
            retryable: true,
          },
          { status: 504 },
        );
      }
      if (error.kind === "invalid-response") {
        return NextResponse.json(
          {
            error: "AI 응답을 처리하지 못했어요. 다시 시도해 주세요.",
            retryable: true,
          },
          { status: 502 },
        );
      }
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
