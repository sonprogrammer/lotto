import { beforeEach, expect, it, vi } from "vitest";

const { userMock, listMock } = vi.hoisted(() => ({
  userMock: vi.fn(),
  listMock: vi.fn(),
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: userMock,
}));
vi.mock("@/entities/notification", () => ({ listNotifications: listMock }));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  userMock.mockResolvedValue({ userId: "65ab12cd34ef56ab78cd90ef" });
  listMock.mockResolvedValue({
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
});

it("lists only the signed-in user's notifications with private cache headers", async () => {
  const response = await GET(
    new Request("http://localhost/api/notifications?page=2"),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(listMock).toHaveBeenCalledWith("65ab12cd34ef56ab78cd90ef", 2, 20);
});

it("rejects unauthenticated and invalid page requests", async () => {
  userMock.mockResolvedValueOnce(null);
  expect(
    (await GET(new Request("http://localhost/api/notifications"))).status,
  ).toBe(401);
  expect(
    (await GET(new Request("http://localhost/api/notifications?page=0")))
      .status,
  ).toBe(400);
  expect(listMock).not.toHaveBeenCalled();
});
