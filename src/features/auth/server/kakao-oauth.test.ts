import { afterEach, describe, expect, it, vi } from "vitest";
import { createKakaoAuthorizationUrl, getKakaoUserId } from "./kakao-oauth";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureKakao() {
  vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
  vi.stubEnv(
    "KAKAO_REDIRECT_URI",
    "https://lotto.example/api/auth/kakao/callback",
  );
}

describe("Kakao OAuth", () => {
  it("builds the authorization URL without requesting profile scopes", () => {
    configureKakao();
    const url = new URL(createKakaoAuthorizationUrl("random-state"));
    expect(url.origin + url.pathname).toBe(
      "https://kauth.kakao.com/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("rest-key");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://lotto.example/api/auth/kakao/callback",
    );
    expect(url.searchParams.get("state")).toBe("random-state");
    expect(url.searchParams.has("scope")).toBe(false);
  });

  it("exchanges the code and returns only Kakao's stable user ID", async () => {
    configureKakao();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-secret",
            refresh_token: "refresh-secret",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 123456,
            kakao_account: { email: "private@example.com" },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    expect(await getKakaoUserId("auth-code")).toBe("123456");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "https://kauth.kakao.com/oauth/token",
    );
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "https://kapi.kakao.com/v2/user/me",
    );
    expect(JSON.stringify(fetchMock.mock.results)).not.toContain(
      "access-secret",
    );
    expect(JSON.stringify(fetchMock.mock.results)).not.toContain(
      "refresh-secret",
    );
  });

  it("rejects provider failures and malformed user IDs", async () => {
    configureKakao();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    await expect(getKakaoUserId("bad-code")).rejects.toThrow();
  });
});
