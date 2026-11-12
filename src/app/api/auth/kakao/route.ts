import { NextResponse } from "next/server";
import {
  getOAuthStateCookieOptions,
  OAUTH_STATE_COOKIE_NAME,
} from "@/features/auth/server/cookies";
import { createKakaoAuthorizationUrl } from "@/features/auth/server/kakao-oauth";
import { createOAuthState } from "@/features/auth/server/oauth-state";
import {
  getKakaoOrigin,
  getKakaoRedirectUri,
} from "@/features/auth/server/kakao-redirect-uri";

export function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = getKakaoOrigin(requestUrl);
    if (requestUrl.origin !== origin) {
      return NextResponse.redirect(
        new URL(`${requestUrl.pathname}${requestUrl.search}`, origin),
      );
    }

    const state = createOAuthState();
    const response = NextResponse.redirect(
      createKakaoAuthorizationUrl(state, getKakaoRedirectUri(requestUrl)),
    );
    response.cookies.set(
      OAUTH_STATE_COOKIE_NAME,
      state,
      getOAuthStateCookieOptions(),
    );
    return response;
  } catch {
    return new NextResponse(null, {
      status: 303,
      headers: { location: "/auth/error?reason=kakao" },
    });
  }
}
