import {
  SavedCombinationCreateSchema,
  SavedCombinationDeleteSchema,
} from "@/entities/saved-combination/model/input";
import {
  createSavedCombination,
  deleteSavedCombinations,
  listSavedCombinations,
} from "@/entities/saved-combination/server/store";
import { SAVED_COMBINATIONS_PAGE_SIZE } from "@/entities/saved-combination/model/page";
import { getCurrentUser } from "@/features/auth/server/current-session";
import {
  privateJson,
  privateNoContent,
} from "@/shared/server/http/private-json";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  const pageValue = new URL(request.url).searchParams.get("page") ?? "1";
  const page = Number(pageValue);
  if (!Number.isSafeInteger(page) || page < 1)
    return privateJson({ error: "페이지 값을 확인해 주세요." }, 400);
  try {
    return privateJson(
      await listSavedCombinations(
        user.userId,
        page,
        SAVED_COMBINATIONS_PAGE_SIZE,
      ),
    );
  } catch {
    return privateJson({ error: "저장한 번호를 불러오지 못했어요." }, 500);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "번호 조합을 확인해 주세요." }, 400);
  }
  const parsed = SavedCombinationCreateSchema.safeParse(body);
  if (!parsed.success)
    return privateJson({ error: "번호 6개와 저장 방식을 확인해 주세요." }, 400);
  try {
    return privateJson(
      await createSavedCombination(user.userId, parsed.data),
      201,
    );
  } catch {
    return privateJson({ error: "번호 조합을 저장하지 못했어요." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "삭제할 번호를 확인해 주세요." }, 400);
  }
  const parsed = SavedCombinationDeleteSchema.safeParse(body);
  if (!parsed.success)
    return privateJson({ error: "삭제할 번호를 확인해 주세요." }, 400);
  try {
    await deleteSavedCombinations(
      user.userId,
      "ids" in parsed.data ? parsed.data.ids : undefined,
    );
    return privateNoContent();
  } catch {
    return privateJson({ error: "번호 조합을 삭제하지 못했어요." }, 500);
  }
}
