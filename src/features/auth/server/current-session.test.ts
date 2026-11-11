import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, findActiveMock, findKakaoUserByIdMock } = vi.hoisted(
  () => ({
    cookiesMock: vi.fn(),
    findActiveMock: vi.fn(),
    findKakaoUserByIdMock: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/features/auth/server/session-store", () => ({
  findActiveAppSession: findActiveMock,
}));
vi.mock("@/features/auth/server/user-store", () => ({
  findKakaoUserById: findKakaoUserByIdMock,
}));

import { getCurrentUser } from "./current-session";

describe("getCurrentUser", () => {
  beforeEach(() => {
    cookiesMock.mockReset().mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-session" }),
    });
    findActiveMock.mockReset().mockResolvedValue({ userId: "user-1" });
    findKakaoUserByIdMock.mockReset().mockResolvedValue({
      nickname: "손영진",
    });
  });

  it("returns the user from the active app session", async () => {
    await expect(getCurrentUser()).resolves.toEqual({
      userId: "user-1",
      nickname: "손영진",
    });
    expect(findActiveMock).toHaveBeenCalledWith("valid-session");
    expect(findKakaoUserByIdMock).toHaveBeenCalledWith("user-1");
  });

  it("signals that the Kakao profile needs refresh when no nickname is stored", async () => {
    findKakaoUserByIdMock.mockResolvedValue(null);
    await expect(getCurrentUser()).resolves.toEqual({
      userId: "user-1",
      nickname: null,
    });
  });

  it("returns null when the session cookie is missing", async () => {
    cookiesMock.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(findActiveMock).not.toHaveBeenCalled();
  });

  it("returns null when the session is expired or invalid", async () => {
    findActiveMock.mockResolvedValue(null);
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("returns null if session storage is unavailable", async () => {
    findActiveMock.mockRejectedValue(new Error("database unavailable"));
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
