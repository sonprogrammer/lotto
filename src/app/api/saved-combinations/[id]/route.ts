import {
  SavedCombinationIdSchema,
  SavedCombinationUpdateSchema,
} from "@/entities/saved-combination/model/input";
import {
  deleteSavedCombination,
  SavedCombinationNotFoundError,
  updateSavedCombination,
} from "@/entities/saved-combination/server/store";
import { getCurrentUser } from "@/features/auth/server/current-session";
import {
  privateJson,
  privateNoContent,
} from "@/shared/server/http/private-json";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  const { id } = await context.params;
  if (!SavedCombinationIdSchema.safeParse(id).success)
    return privateJson({ error: "저장한 번호를 찾을 수 없어요." }, 400);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "수정할 번호를 확인해 주세요." }, 400);
  }
  const parsed = SavedCombinationUpdateSchema.safeParse(body);
  if (!parsed.success)
    return privateJson({ error: "서로 다른 번호 6개를 선택해 주세요." }, 400);
  try {
    return privateJson(
      await updateSavedCombination(user.userId, id, parsed.data.numbers),
    );
  } catch (error) {
    if (error instanceof SavedCombinationNotFoundError)
      return privateJson({ error: "저장한 번호를 찾을 수 없어요." }, 404);
    return privateJson({ error: "번호 조합을 수정하지 못했어요." }, 500);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  const { id } = await context.params;
  if (!SavedCombinationIdSchema.safeParse(id).success)
    return privateJson({ error: "저장한 번호를 찾을 수 없어요." }, 400);
  try {
    await deleteSavedCombination(user.userId, id);
    return privateNoContent();
  } catch (error) {
    if (error instanceof SavedCombinationNotFoundError)
      return privateJson({ error: "저장한 번호를 찾을 수 없어요." }, 404);
    return privateJson({ error: "번호 조합을 삭제하지 못했어요." }, 500);
  }
}
