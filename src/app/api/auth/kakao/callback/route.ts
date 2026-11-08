import { NextResponse, type NextRequest } from "next/server";
import {
  getClearOAuthStateCookieOptions,
  getSessionCookieOptions,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/features/auth/server/cookies";
import { getKakaoUserId } from "@/features/auth/server/kakao-oauth";
import { createAppSession } from "@/features/auth/server/session-store";
import { isOAuthStateValid } from "@/features/auth/server/oauth-state";
import { findOrCreateKakaoUser } from "@/features/auth/server/user-store";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const state = params.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!isOAuthStateValid(cookieState, state)) return redirectToError(request);

  if (params.has("error") || !params.get("code"))
    return redirectToError(request);

  try {
    const kakaoId = await getKakaoUserId(params.get("code")!);
    const { userId } = await findOrCreateKakaoUser(kakaoId);
    const sessionToken = await createAppSession(userId);
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions(),
    );
    response.cookies.set(
      OAUTH_STATE_COOKIE_NAME,
      "",
      getClearOAuthStateCookieOptions(),
    );
    return response;
  } catch {
    return redirectToError(request);
  }
}

function redirectToError(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/auth/error?reason=kakao", request.url),
  );
  response.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    "",
    getClearOAuthStateCookieOptions(),
  );
  return response;
}
