import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, deleteSessionMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  deleteSessionMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/features/auth/server/session-store", () => ({
  deleteAppSession: deleteSessionMock,
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  const setCookie = vi.fn();

  beforeEach(() => {
    setCookie.mockReset();
    cookiesMock.mockReset().mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "session-token" }),
      set: setCookie,
    });
    deleteSessionMock.mockReset().mockResolvedValue(undefined);
  });

  it("deletes only the current session and clears its cookie", async () => {
    const response = await POST();

    expect(deleteSessionMock).toHaveBeenCalledWith("session-token");
    expect(response.status).toBe(204);
    expect(setCookie).toHaveBeenCalledWith(
      "lotto_session",
      "",
      expect.objectContaining({ maxAge: 0, httpOnly: true }),
    );
  });

  it("clears an already logged-out browser without deleting a session", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: setCookie,
    });
    const response = await POST();

    expect(deleteSessionMock).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
    expect(setCookie).toHaveBeenCalled();
  });

  it("does not claim logout succeeded when session deletion fails", async () => {
    deleteSessionMock.mockRejectedValue(new Error("database unavailable"));
    const response = await POST();

    expect(response.status).toBe(500);
    expect(setCookie).not.toHaveBeenCalled();
  });
});
