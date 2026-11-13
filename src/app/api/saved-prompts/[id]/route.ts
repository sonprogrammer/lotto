import {
  SavedPromptIdSchema,
  SavedPromptUpdateSchema,
} from "@/entities/saved-prompt/model/input";
import {
  deleteSavedPrompt,
  SavedPromptNotFoundError,
  updateSavedPrompt,
} from "@/entities/saved-prompt/server/store";
import { getCurrentUser } from "@/features/auth/server/current-session";
import {
  privateJson,
  privateNoContent,
} from "@/shared/server/http/private-json";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  const { id } = await context.params;
  if (!SavedPromptIdSchema.safeParse(id).success)
    return privateJson({ error: "프롬프트를 찾을 수 없어요." }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "수정할 내용을 확인해 주세요." }, 400);
  }
  const parsed = SavedPromptUpdateSchema.safeParse(body);
  if (!parsed.success)
    return privateJson(
      { error: "제목은 30자, 내용은 300자 이내로 입력해 주세요." },
      400,
    );

  try {
    return privateJson(
      await updateSavedPrompt(currentUser.userId, id, parsed.data),
    );
  } catch (error) {
    if (error instanceof SavedPromptNotFoundError)
      return privateJson({ error: "프롬프트를 찾을 수 없어요." }, 404);
    return privateJson({ error: "프롬프트를 수정하지 못했어요." }, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return privateJson({ error: "로그인이 필요해요." }, 401);

  const { id } = await context.params;
  if (!SavedPromptIdSchema.safeParse(id).success)
    return privateJson({ error: "프롬프트를 찾을 수 없어요." }, 400);

  try {
    await deleteSavedPrompt(currentUser.userId, id);
    return privateNoContent();
  } catch (error) {
    if (error instanceof SavedPromptNotFoundError)
      return privateJson({ error: "프롬프트를 찾을 수 없어요." }, 404);
    return privateJson({ error: "프롬프트를 삭제하지 못했어요." }, 500);
  }
}
