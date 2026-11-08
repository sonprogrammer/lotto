import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getClearSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/features/auth/server/cookies";
import { deleteAppSession } from "@/features/auth/server/session-store";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    if (token) await deleteAppSession(token);
  } catch {
    return NextResponse.json({ error: "logout_failed" }, { status: 500 });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", getClearSessionCookieOptions());
  return new Response(null, { status: 204 });
}
