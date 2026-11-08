import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/features/auth/server/oauth-state", () => ({
  createOAuthState: () => "state-value",
}));

afterEach(() => vi.unstubAllEnvs());

describe("Kakao login start", () => {
  it("redirects to Kakao and stores state in a short-lived HttpOnly cookie", () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "KAKAO_REDIRECT_URI",
      "https://lotto.example/api/auth/kakao/callback",
    );
    const response = GET();
    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe("https://kauth.kakao.com");
    expect(location.searchParams.get("state")).toBe("state-value");
    const cookie = response.headers.getSetCookie()[0];
    expect(cookie).toContain("lotto_oauth_state=state-value");
    expect(cookie).toContain("Max-Age=600");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("returns to the safe error screen when credentials are missing", () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    const response = GET();
    expect(response.headers.get("location")).toBe("/auth/error?reason=kakao");
  });
});
