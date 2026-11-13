import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getClearSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/features/auth/server/cookies";
import { deleteAppSession } from "@/features/auth/server/session-store";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { deletePushSubscription } from "@/entities/notification";
import { z } from "zod";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    const payload = (await request.json().catch(() => null)) as {
      endpoint?: unknown;
    } | null;
    if (payload?.endpoint != null) {
      const endpoint = z.string().url().safeParse(payload.endpoint);
      if (!endpoint.success)
        return NextResponse.json({ error: "logout_failed" }, { status: 400 });
      const user = await getCurrentUser();
      if (token && !user) throw new Error("active_session_unavailable");
      if (user) await deletePushSubscription(user.userId, endpoint.data);
    }
    if (token) await deleteAppSession(token);
  } catch {
    return NextResponse.json({ error: "logout_failed" }, { status: 500 });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", getClearSessionCookieOptions());
  return new Response(null, { status: 204 });
}
