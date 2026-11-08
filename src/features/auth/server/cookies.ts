const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;

export const SESSION_COOKIE_NAME = "lotto_session";
export const OAUTH_STATE_COOKIE_NAME = "lotto_oauth_state";

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookie(),
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function getClearSessionCookieOptions() {
  return { ...getSessionCookieOptions(), maxAge: 0 };
}

export function getOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookie(),
    path: "/",
    maxAge: 10 * 60,
  };
}

export function getClearOAuthStateCookieOptions() {
  return { ...getOAuthStateCookieOptions(), maxAge: 0 };
}
