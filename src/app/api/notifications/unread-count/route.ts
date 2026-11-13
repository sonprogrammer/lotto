import { countUnreadNotifications } from "@/entities/notification";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { privateJson } from "@/shared/server/http/private-json";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  try {
    return privateJson({ count: await countUnreadNotifications(user.userId) });
  } catch {
    return privateJson({ error: "알림 수를 불러오지 못했어요." }, 500);
  }
}
