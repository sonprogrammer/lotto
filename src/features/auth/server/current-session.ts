import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./cookies";
import { findActiveAppSession } from "./session-store";
import { findKakaoUserById } from "./user-store";

export async function getCurrentUser(): Promise<{
  userId: string;
  nickname: string | null;
} | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const session = await findActiveAppSession(token);
    if (!session) return null;
    const user = await findKakaoUserById(session.userId);
    return { userId: session.userId, nickname: user?.nickname ?? null };
  } catch {
    return null;
  }
}
