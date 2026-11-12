import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createKakaoAuthorizationUrl,
  getKakaoUserProfile,
} from "./kakao-oauth";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureKakao() {
  vi.stubEnv("KAKAO_REST_API_KEY", "rest-key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "client-secret");
  vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
}

describe("Kakao OAuth", () => {
  it("requests only the required Kakao nickname scope", () => {
    configureKakao();
    const redirectUri = "https://lotto-preview.example/api/auth/kakao/callback";
    const url = new URL(
      createKakaoAuthorizationUrl("random-state", redirectUri),
    );
    expect(url.origin + url.pathname).toBe(
      "https://kauth.kakao.com/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("rest-key");
    expect(url.searchParams.get("redirect_uri")).toBe(redirectUri);
    expect(url.searchParams.get("state")).toBe("random-state");
    expect(url.searchParams.get("scope")).toBe("profile_nickname");
  });

  it("exchanges the code and returns the user ID and agreed nickname", async () => {
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
            kakao_account: { profile: { nickname: "손영진" } },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const redirectUri = "https://lotto-preview.example/api/auth/kakao/callback";
    expect(await getKakaoUserProfile("auth-code", redirectUri)).toEqual({
      kakaoId: "123456",
      nickname: "손영진",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "https://kauth.kakao.com/oauth/token",
    );
    const tokenRequestBody = fetchMock.mock.calls[0][1]
      ?.body as URLSearchParams;
    expect(tokenRequestBody).toBeInstanceOf(URLSearchParams);
    expect(tokenRequestBody.get("redirect_uri")).toBe(redirectUri);
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
    await expect(
      getKakaoUserProfile(
        "bad-code",
        "https://lotto-preview.example/api/auth/kakao/callback",
      ),
    ).rejects.toThrow();
  });

  it("rejects a Kakao response without the required nickname", async () => {
    configureKakao();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-secret" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 123456 }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getKakaoUserProfile(
        "auth-code",
        "https://lotto-preview.example/api/auth/kakao/callback",
      ),
    ).rejects.toThrow("Kakao user response is invalid");
  });
});
