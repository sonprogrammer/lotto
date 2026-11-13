import { privateJson } from "@/shared/server/http/private-json";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { SavedPromptCreateSchema } from "@/entities/saved-prompt/model/input";
import {
  createSavedPrompt,
  listSavedPrompts,
  SavedPromptLimitError,
} from "@/entities/saved-prompt/server/store";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  try {
    return privateJson(await listSavedPrompts(currentUser.userId));
  } catch {
    return privateJson({ error: "저장 프롬프트를 불러오지 못했어요." }, 500);
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "프롬프트 내용을 확인해 주세요." }, 400);
  }
  const parsed = SavedPromptCreateSchema.safeParse(body);
  if (!parsed.success)
    return privateJson(
      { error: "제목은 30자, 내용은 300자 이내로 입력해 주세요." },
      400,
    );

  try {
    return privateJson(
      await createSavedPrompt(currentUser.userId, parsed.data),
      201,
    );
  } catch (error) {
    if (error instanceof SavedPromptLimitError)
      return privateJson(
        { error: "프롬프트는 최대 5개까지 저장할 수 있어요." },
        409,
      );
    return privateJson({ error: "프롬프트를 저장하지 못했어요." }, 500);
  }
}
