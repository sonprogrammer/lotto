import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { afterEach } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  isOAuthStateValid: vi.fn(),
  getKakaoUserId: vi.fn(),
  findOrCreateKakaoUser: vi.fn(),
  createAppSession: vi.fn(),
}));
vi.mock("@/features/auth/server/oauth-state", () => ({
  isOAuthStateValid: mocks.isOAuthStateValid,
}));
vi.mock("@/features/auth/server/kakao-oauth", () => ({
  getKakaoUserId: mocks.getKakaoUserId,
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
  mocks.isOAuthStateValid.mockReturnValue(true);
  mocks.getKakaoUserId.mockResolvedValue("kakao-user-id");
  mocks.findOrCreateKakaoUser.mockResolvedValue({ userId: "app-user-id" });
  mocks.createAppSession.mockResolvedValue("session-secret");
});

function request(query: string, cookies = "lotto_oauth_state=state-value") {
  return new NextRequest(
    `https://lotto.example/api/auth/kakao/callback?${query}`,
    {
      headers: { cookie: cookies },
    },
  );
}

describe("Kakao callback", () => {
  it("validates state before contacting Kakao, then sets the app session cookie", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "KAKAO_REDIRECT_URI",
      "https://lotto.example/api/auth/kakao/callback",
    );
    const response = await GET(request("code=auth-code&state=state-value"));
    expect(mocks.isOAuthStateValid).toHaveBeenCalledWith(
      "state-value",
      "state-value",
    );
    expect(mocks.getKakaoUserId).toHaveBeenCalledWith("auth-code");
    expect(mocks.findOrCreateKakaoUser).toHaveBeenCalledWith("kakao-user-id");
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

  it("redirects to the configured site origin instead of a supplied Host", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "KAKAO_REDIRECT_URI",
      "https://lotto.example/api/auth/kakao/callback",
    );
    const response = await GET(
      new NextRequest(
        "https://attacker.example/api/auth/kakao/callback?code=auth-code&state=state-value",
        { headers: { cookie: "lotto_oauth_state=state-value" } },
      ),
    );

    expect(response.headers.get("location")).toBe("https://lotto.example/");
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
    mocks.getKakaoUserId.mockRejectedValue(new Error("provider detail"));
    const response = await GET(request("code=auth-code&state=state-value"));
    expect(response.headers.get("location")).toContain("/auth/error");
    expect(response.headers.get("location")).not.toContain("provider detail");
    expect(mocks.createAppSession).not.toHaveBeenCalled();
  });
});
