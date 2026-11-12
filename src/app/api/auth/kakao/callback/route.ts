import { NextResponse, type NextRequest } from "next/server";
import {
  getClearOAuthStateCookieOptions,
  getSessionCookieOptions,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/features/auth/server/cookies";
import { getKakaoUserProfile } from "@/features/auth/server/kakao-oauth";
import { createAppSession } from "@/features/auth/server/session-store";
import { isOAuthStateValid } from "@/features/auth/server/oauth-state";
import { findOrCreateKakaoUser } from "@/features/auth/server/user-store";
import {
  getKakaoOrigin,
  getKakaoRedirectUri,
} from "@/features/auth/server/kakao-redirect-uri";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  let origin: string;
  let redirectUri: string;
  try {
    origin = getKakaoOrigin(requestUrl);
    if (requestUrl.origin !== origin) {
      return NextResponse.redirect(
        new URL(`${requestUrl.pathname}${requestUrl.search}`, origin),
      );
    }
    redirectUri = getKakaoRedirectUri(requestUrl);
  } catch {
    return redirectToError();
  }

  const params = request.nextUrl.searchParams;
  const state = params.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!isOAuthStateValid(cookieState, state)) return redirectToError();

  if (params.has("error") || !params.get("code")) return redirectToError();

  try {
    const kakaoProfile = await getKakaoUserProfile(
      params.get("code")!,
      redirectUri,
    );
    const { userId } = await findOrCreateKakaoUser(
      kakaoProfile.kakaoId,
      kakaoProfile.nickname,
    );
    const sessionToken = await createAppSession(userId);
    const response = NextResponse.redirect(new URL("/", origin), {
      status: 303,
    });
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
    return redirectToError();
  }
}

function redirectToError() {
  const response = new NextResponse(null, {
    status: 303,
    headers: { location: "/auth/error?reason=kakao" },
  });
  response.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    "",
    getClearOAuthStateCookieOptions(),
  );
  return response;
}
