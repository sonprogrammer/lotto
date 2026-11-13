import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  deleteSessionMock,
  getCurrentUserMock,
  deleteSubscriptionMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  deleteSessionMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  deleteSubscriptionMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/features/auth/server/session-store", () => ({
  deleteAppSession: deleteSessionMock,
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/notification", () => ({
  deletePushSubscription: deleteSubscriptionMock,
}));

import { POST } from "./route";

const logoutRequest = (body?: unknown) =>
  new Request("http://localhost/api/auth/logout", {
    method: "POST",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });

describe("POST /api/auth/logout", () => {
  const setCookie = vi.fn();

  beforeEach(() => {
    setCookie.mockReset();
    cookiesMock.mockReset().mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "session-token" }),
      set: setCookie,
    });
    deleteSessionMock.mockReset().mockResolvedValue(undefined);
    getCurrentUserMock
      .mockReset()
      .mockResolvedValue({ userId: "65ab12cd34ef56ab78cd90ef" });
    deleteSubscriptionMock.mockReset().mockResolvedValue(true);
  });

  it("deletes only the current session and clears its cookie", async () => {
    const response = await POST(logoutRequest());

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
    const response = await POST(logoutRequest());

    expect(deleteSessionMock).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
    expect(setCookie).toHaveBeenCalled();
  });

  it("does not claim logout succeeded when session deletion fails", async () => {
    deleteSessionMock.mockRejectedValue(new Error("database unavailable"));
    const response = await POST(logoutRequest());

    expect(response.status).toBe(500);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("removes only the current user's current-device subscription before logout", async () => {
    const response = await POST(
      logoutRequest({ endpoint: "https://push.example/device-a" }),
    );
    expect(deleteSubscriptionMock).toHaveBeenCalledWith(
      "65ab12cd34ef56ab78cd90ef",
      "https://push.example/device-a",
    );
    expect(deleteSessionMock).toHaveBeenCalledWith("session-token");
    expect(response.status).toBe(204);
  });

  it("keeps the session active when removing the device subscription fails", async () => {
    deleteSubscriptionMock.mockRejectedValue(new Error("database unavailable"));
    const response = await POST(
      logoutRequest({ endpoint: "https://push.example/device-a" }),
    );
    expect(response.status).toBe(500);
    expect(deleteSessionMock).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });
});
