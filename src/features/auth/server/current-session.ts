import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./cookies";
import { findActiveAppSession } from "./session-store";

export async function getCurrentUser(): Promise<{ userId: string } | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await findActiveAppSession(token);
  } catch {
    return null;
  }
}
