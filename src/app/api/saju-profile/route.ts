import { SajuProfileInputSchema } from "@/entities/user/model/saju-profile";
import {
  getSajuProfile,
  saveSajuProfile,
} from "@/entities/user/server/saju-profile-store";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { getKstDateKey } from "@/features/daily-saju/lib/get-kst-date-key";
import {
  deleteSajuProfile,
  SajuProfileNotFoundError,
} from "@/features/daily-saju/server/delete-saju-profile";
import {
  privateJson,
  privateNoContent,
} from "@/shared/server/http/private-json";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  try {
    return privateJson({
      profile: await getSajuProfile(currentUser.userId),
      dateKey: getKstDateKey(new Date()),
    });
  } catch {
    return privateJson({ error: "사주 정보를 불러오지 못했어요." }, 500);
  }
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "사주 정보를 확인해 주세요." }, 400);
  }
  const parsed = SajuProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return privateJson(
      { error: "이름과 생년월일, 달력 정보를 확인해 주세요." },
      400,
    );
  }

  try {
    return privateJson(await saveSajuProfile(currentUser.userId, parsed.data));
  } catch {
    return privateJson({ error: "사주 정보를 저장하지 못했어요." }, 500);
  }
}

export async function DELETE() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  try {
    await deleteSajuProfile(currentUser.userId);
    return privateNoContent();
  } catch (error) {
    if (error instanceof SajuProfileNotFoundError) {
      return privateJson({ error: "사주 정보를 찾을 수 없어요." }, 404);
    }
    return privateJson({ error: "사주 정보를 삭제하지 못했어요." }, 500);
  }
}
