import { getCurrentUser } from "@/features/auth/server/current-session";
import { getKstDateKey } from "@/features/daily-saju/lib/get-kst-date-key";
import {
  ensureDailyRecommendation,
  SajuProfileRequiredError,
} from "@/features/daily-saju/server/ensure-daily-recommendation";
import { GroqDailyNumberError } from "@/features/daily-saju/server/groq-daily-number";
import { privateJson } from "@/shared/server/http/private-json";

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  const dateKey = getKstDateKey(new Date());
  try {
    const recommendation = await ensureDailyRecommendation(
      currentUser.userId,
      dateKey,
    );
    return privateJson(
      {
        id: recommendation._id.toHexString(),
        dateKey: recommendation.dateKey,
        status: recommendation.status,
        ...(recommendation.number !== undefined && {
          number: recommendation.number,
        }),
        ...(recommendation.explanation !== undefined && {
          explanation: recommendation.explanation,
        }),
      },
      recommendation.status === "generating" ? 202 : 200,
    );
  } catch (error) {
    if (error instanceof SajuProfileRequiredError) {
      return privateJson(
        { state: "profile-required", error: "사주 정보를 먼저 등록해 주세요." },
        409,
      );
    }
    if (error instanceof GroqDailyNumberError) {
      return privateJson(
        {
          error: "오늘의 숫자를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
          retryable: true,
        },
        503,
      );
    }
    return privateJson(
      { error: "오늘의 숫자를 불러오지 못했어요.", retryable: true },
      500,
    );
  }
}
