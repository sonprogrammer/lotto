import { afterEach, describe, expect, it, vi } from "vitest";
import { getKakaoConfig, getMongoConfig } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("server auth configuration", () => {
  it("reads MongoDB settings without requiring Kakao settings", () => {
    vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017");
    vi.stubEnv("MONGODB_DB_NAME", "lotto");
    expect(getMongoConfig()).toEqual({
      uri: "mongodb://localhost:27017",
      dbName: "lotto",
    });
  });

  it.each(["", "https://example.com", "mongodb://"])(
    "rejects invalid MongoDB URI %s",
    (uri) => {
      vi.stubEnv("MONGODB_URI", uri);
      vi.stubEnv("MONGODB_DB_NAME", "lotto");
      expect(() => getMongoConfig()).toThrow();
    },
  );

  it.each(["", "bad/name", "bad.name"])(
    "rejects invalid database name %s",
    (name) => {
      vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017");
      vi.stubEnv("MONGODB_DB_NAME", name);
      expect(() => getMongoConfig()).toThrow();
    },
  );

  it("reads the fixed Kakao callback path", () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "secret");
    vi.stubEnv("KAKAO_REDIRECT_URI", "/api/auth/kakao/callback");
    expect(getKakaoConfig()).toEqual({
      restApiKey: "key",
      clientSecret: "secret",
      redirectUri: "/api/auth/kakao/callback",
    });
  });

  it("rejects missing credentials without exposing secret values", () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "private-key");
    vi.stubEnv("KAKAO_CLIENT_SECRET", "");
    vi.stubEnv("KAKAO_REDIRECT_URI", "javascript:private-secret");
    expect(() => getKakaoConfig()).toThrow(
      "Kakao authentication is not configured",
    );
  });
});
