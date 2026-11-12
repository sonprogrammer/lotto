import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { afterEach } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  isOAuthStateValid: vi.fn(),
  getKakaoUserProfile: vi.fn(),
  findOrCreateKakaoUser: vi.fn(),
  createAppSession: vi.fn(),
}));
vi.mock("@/features/auth/server/oauth-state", () => ({
  isOAuthStateValid: mocks.isOAuthStateValid,
}));
vi.mock("@/features/auth/server/kakao-oauth", () => ({
  getKakaoUserProfile: mocks.getKakaoUserProfile,
}));
vi.mock("@/features/auth/server/user-store", () => ({
  findOrCreateKakaoUser: mocks.findOrCreateKakaoUser,
}));
vi.mock("@/features/auth/server/session-store", () => ({
  createAppSession: mocks.createAppSession,
}));

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_BRANCH_URL", "lotto.example");
  mocks.isOAuthStateValid.mockReturnValue(true);
  mocks.getKakaoUserProfile.mockResolvedValue({
    kakaoId: "kakao-user-id",
    nickname: "손영진",
  });
  mocks.findOrCreateKakaoUser.mockResolvedValue({ userId: "app-user-id" });
  mocks.createAppSession.mockResolvedValue("session-secret");
});

function request(
  query: string,
  cookies = "lotto_oauth_state=state-value",
  origin = "https://lotto.example",
) {
  return new NextRequest(`${origin}/api/auth/kakao/callback?${query}`, {
    headers: { cookie: cookies },
  });
}

describe("Kakao callback", () => {
  it("validates state before contacting Kakao, then sets the app session cookie", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
    const response = await GET(request("code=auth-code&state=state-value"));
    expect(mocks.isOAuthStateValid).toHaveBeenCalledWith(
      "state-value",
      "state-value",
    );
    expect(mocks.getKakaoUserProfile).toHaveBeenCalledWith(
      "auth-code",
      "https://lotto.example/api/auth/kakao/callback",
    );
    expect(mocks.findOrCreateKakaoUser).toHaveBeenCalledWith(
      "kakao-user-id",
      "손영진",
    );
    expect(mocks.createAppSession).toHaveBeenCalledWith("app-user-id");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://lotto.example/");
    const cookies = response.headers.getSetCookie().join(";");
    expect(cookies).toContain("lotto_session=session-secret");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toMatch(/SameSite=lax/i);
    expect(cookies).toContain("Max-Age=2592000");
    expect(cookies).toContain("lotto_oauth_state=;");
  });

  it("redirects a callback to the stable branch URL", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
    const response = await GET(
      new NextRequest(
        "https://deployment-123.vercel.app/api/auth/kakao/callback?code=auth-code&state=state-value",
        { headers: { cookie: "lotto_oauth_state=state-value" } },
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://lotto.example/api/auth/kakao/callback?code=auth-code&state=state-value",
    );
  });

  it("uses the production domain for token exchange and post-login redirect", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "lotto-amber.vercel.app");

    const response = await GET(
      request(
        "code=auth-code&state=state-value",
        "lotto_oauth_state=state-value",
        "https://lotto-amber.vercel.app",
      ),
    );

    expect(mocks.getKakaoUserProfile).toHaveBeenCalledWith(
      "auth-code",
      "https://lotto-amber.vercel.app/api/auth/kakao/callback",
    );
    expect(response.headers.get("location")).toBe(
      "https://lotto-amber.vercel.app/",
    );
  });

  it.each([
    ["state mismatch", "code=auth-code&state=wrong", false],
    ["missing code", "state=state-value", true],
    ["provider cancellation", "error=access_denied&state=state-value", true],
  ])("does not create a session for %s", async (_label, query, validState) => {
    mocks.isOAuthStateValid.mockReturnValue(validState);
    const response = await GET(request(query));
    expect(response.headers.get("location")).toContain("/auth/error");
    expect(mocks.createAppSession).not.toHaveBeenCalled();
    expect(response.headers.getSetCookie().join(";")).toContain(
      "lotto_oauth_state=;",
    );
  });

  it("redirects safely when provider or storage work fails", async () => {
    mocks.getKakaoUserProfile.mockRejectedValue(new Error("provider detail"));
    const response = await GET(request("code=auth-code&state=state-value"));
    expect(response.headers.get("location")).toContain("/auth/error");
    expect(response.headers.get("location")).not.toContain("provider detail");
    expect(mocks.createAppSession).not.toHaveBeenCalled();
  });

  it("stores the agreed Kakao nickname with the account", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
    await GET(request("code=auth-code&state=state-value"));

    expect(mocks.findOrCreateKakaoUser).toHaveBeenCalledWith(
      "kakao-user-id",
      "손영진",
    );
  });
});
