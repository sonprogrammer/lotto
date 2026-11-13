import { beforeEach, expect, it, vi } from "vitest";

const { userMock, upsertMock, deleteMock } = vi.hoisted(() => ({
  userMock: vi.fn(),
  upsertMock: vi.fn(),
  deleteMock: vi.fn(),
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: userMock,
}));
vi.mock("@/entities/notification", () => ({
  upsertPushSubscription: upsertMock,
  deletePushSubscription: deleteMock,
}));

import { DELETE, POST } from "./route";

const user = { userId: "65ab12cd34ef56ab78cd90ef" };
const makeRequest = (method: string, body: unknown) =>
  new Request("http://localhost/api/push-subscriptions", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  userMock.mockResolvedValue(user);
  upsertMock.mockResolvedValue(undefined);
  deleteMock.mockResolvedValue(true);
});

it("stores a valid push subscription under the authenticated account", async () => {
  const payload = {
    endpoint: "https://push.example/device",
    keys: { p256dh: "public", auth: "secret" },
    userAgent: "test browser",
  };
  expect((await POST(makeRequest("POST", payload))).status).toBe(204);
  expect(upsertMock).toHaveBeenCalledWith(user.userId, payload);
});

it("rejects invalid or unauthenticated subscription operations", async () => {
  expect((await POST(makeRequest("POST", { endpoint: "bad" }))).status).toBe(
    400,
  );
  userMock.mockResolvedValueOnce(null);
  expect(
    (
      await DELETE(
        makeRequest("DELETE", { endpoint: "https://push.example/device" }),
      )
    ).status,
  ).toBe(401);
  expect(upsertMock).not.toHaveBeenCalled();
  expect(deleteMock).not.toHaveBeenCalled();
});
