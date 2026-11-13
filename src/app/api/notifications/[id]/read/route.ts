import { markNotificationRead } from "@/entities/notification";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { privateJson } from "@/shared/server/http/private-json";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  const { id } = await params;
  try {
    const notification = await markNotificationRead(user.userId, id);
    return notification
      ? privateJson(notification)
      : privateJson({ error: "알림을 찾을 수 없어요." }, 404);
  } catch {
    return privateJson({ error: "알림을 처리하지 못했어요." }, 500);
  }
}
