import { getKakaoConfig } from "./config";

const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";

export function createKakaoAuthorizationUrl(state: string): string {
  const config = getKakaoConfig();
  const url = new URL(KAKAO_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.restApiKey);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", "profile_nickname");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function getKakaoUserProfile(
  code: string,
): Promise<{ kakaoId: string; nickname: string }> {
  const config = getKakaoConfig();
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.restApiKey,
    redirect_uri: config.redirectUri,
    code,
    client_secret: config.clientSecret,
  });
  const tokenResponse = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error("Kakao token exchange failed");

  const tokenData: unknown = await tokenResponse.json();
  if (!isKakaoTokenResponse(tokenData))
    throw new Error("Kakao token response is invalid");

  const userResponse = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Kakao user lookup failed");

  const userData: unknown = await userResponse.json();
  if (!isKakaoUserProfileResponse(userData))
    throw new Error("Kakao user response is invalid");
  return {
    kakaoId: String(userData.id),
    nickname: userData.kakao_account.profile.nickname.trim(),
  };
}

function isKakaoTokenResponse(
  value: unknown,
): value is { access_token: string; refresh_token?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "access_token" in value &&
    typeof value.access_token === "string" &&
    value.access_token.length > 0
  );
}

function isKakaoUserProfileResponse(value: unknown): value is {
  id: number | string;
  kakao_account: { profile: { nickname: string } };
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    (typeof value.id === "number" ||
      (typeof value.id === "string" && value.id.length > 0)) &&
    "kakao_account" in value &&
    typeof value.kakao_account === "object" &&
    value.kakao_account !== null &&
    "profile" in value.kakao_account &&
    typeof value.kakao_account.profile === "object" &&
    value.kakao_account.profile !== null &&
    "nickname" in value.kakao_account.profile &&
    typeof value.kakao_account.profile.nickname === "string" &&
    value.kakao_account.profile.nickname.trim().length > 0
  );
}
