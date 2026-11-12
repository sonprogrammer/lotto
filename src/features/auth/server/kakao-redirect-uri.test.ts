import { afterEach, describe, expect, it, vi } from "vitest";
import { getKakaoOrigin, getKakaoRedirectUri } from "./kakao-redirect-uri";

afterEach(() => vi.unstubAllEnvs());

function configureKakao() {
  vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
  vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
}

describe("Kakao redirect URI", () => {
  it("uses the stable Vercel branch URL for preview deployments", () => {
    configureKakao();
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_BRANCH_URL", "lotto-git-feature-team.vercel.app");

    const origin = getKakaoOrigin(
      new URL("https://lotto-deployment-123.vercel.app/api/auth/kakao"),
    );

    expect(origin).toBe("https://lotto-git-feature-team.vercel.app");
    expect(
      getKakaoRedirectUri(
        new URL("https://lotto-deployment-123.vercel.app/api/auth/kakao"),
      ),
    ).toBe("https://lotto-git-feature-team.vercel.app/api/auth/kakao/callback");
  });

  it("uses the production domain for production deployments", () => {
    configureKakao();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "lotto-amber.vercel.app");

    expect(
      getKakaoOrigin(
        new URL("https://lotto-deployment-123.vercel.app/api/auth/kakao"),
      ),
    ).toBe("https://lotto-amber.vercel.app");
  });

  it("uses the request origin outside Vercel", () => {
    configureKakao();
    vi.stubEnv("VERCEL_ENV", "development");

    expect(
      getKakaoRedirectUri(new URL("http://localhost:3000/api/auth/kakao")),
    ).toBe("http://localhost:3000/api/auth/kakao/callback");
  });

  it("rejects a Vercel deployment without its canonical domain", () => {
    configureKakao();
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_BRANCH_URL", "");

    expect(() =>
      getKakaoOrigin(
        new URL("https://lotto-preview.vercel.app/api/auth/kakao"),
      ),
    ).toThrow("Vercel branch URL is not configured");
  });

  it("fails closed in production when Vercel environment variables are absent", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() =>
      getKakaoOrigin(new URL("https://untrusted.example/api/auth/kakao")),
    ).toThrow("Vercel environment is not configured");
  });
});
