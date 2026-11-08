import { NextResponse } from "next/server";
import {
  getOAuthStateCookieOptions,
  OAUTH_STATE_COOKIE_NAME,
} from "@/features/auth/server/cookies";
import { createKakaoAuthorizationUrl } from "@/features/auth/server/kakao-oauth";
import { createOAuthState } from "@/features/auth/server/oauth-state";

export function GET() {
  try {
    const state = createOAuthState();
    const response = NextResponse.redirect(createKakaoAuthorizationUrl(state));
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
