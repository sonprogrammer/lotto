import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/features/auth/server/oauth-state", () => ({
  createOAuthState: () => "state-value",
}));

afterEach(() => vi.unstubAllEnvs());

function request(url = "https://lotto-preview.example/api/auth/kakao") {
  return new Request(url);
}

function configurePreview() {
  vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
  vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_BRANCH_URL", "lotto-preview.example");
}

describe("Kakao login start", () => {
  it("uses the current branch URL as the Kakao callback", () => {
    configurePreview();
    const response = GET(request());
    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe("https://kauth.kakao.com");
    expect(location.searchParams.get("state")).toBe("state-value");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://lotto-preview.example/api/auth/kakao/callback",
    );
    const cookie = response.headers.getSetCookie()[0];
    expect(cookie).toContain("lotto_oauth_state=state-value");
    expect(cookie).toContain("Max-Age=600");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("moves a deployment URL to its stable branch URL before starting login", () => {
    configurePreview();
    const response = GET(
      request("https://lotto-deployment-123.vercel.app/api/auth/kakao"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://lotto-preview.example/api/auth/kakao",
    );
  });

  it("uses the production domain as the Kakao callback", () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
    vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "lotto-amber.vercel.app");

    const response = GET(
      request("https://lotto-amber.vercel.app/api/auth/kakao"),
    );
    const location = new URL(response.headers.get("location")!);

    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://lotto-amber.vercel.app/api/auth/kakao/callback",
    );
  });

  it("returns to the safe error screen when credentials are missing", () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    const response = GET(request());
    expect(response.headers.get("location")).toBe("/auth/error?reason=kakao");
  });
});
