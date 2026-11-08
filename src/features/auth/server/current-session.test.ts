import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, findActiveMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  findActiveMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/features/auth/server/session-store", () => ({
  findActiveAppSession: findActiveMock,
}));

import { getCurrentUser } from "./current-session";

describe("getCurrentUser", () => {
  beforeEach(() => {
    cookiesMock.mockReset().mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-session" }),
    });
    findActiveMock.mockReset().mockResolvedValue({ userId: "user-1" });
  });

  it("returns the user from the active app session", async () => {
    await expect(getCurrentUser()).resolves.toEqual({ userId: "user-1" });
    expect(findActiveMock).toHaveBeenCalledWith("valid-session");
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
