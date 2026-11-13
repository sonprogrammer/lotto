import { listNotifications } from "@/entities/notification";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { privateJson } from "@/shared/server/http/private-json";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  const value = Number(new URL(request.url).searchParams.get("page") ?? "1");
  if (!Number.isSafeInteger(value) || value < 1)
    return privateJson({ error: "페이지 값을 확인해 주세요." }, 400);
  try {
    return privateJson(await listNotifications(user.userId, value, 20));
  } catch {
    return privateJson({ error: "알림을 불러오지 못했어요." }, 500);
  }
}
