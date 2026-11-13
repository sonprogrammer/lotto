import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, listMock, createMock, deleteManyMock } = vi.hoisted(
  () => ({
    getCurrentUserMock: vi.fn(),
    listMock: vi.fn(),
    createMock: vi.fn(),
    deleteManyMock: vi.fn(),
  }),
);

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/saved-combination/server/store", () => ({
  listSavedCombinations: listMock,
  createSavedCombination: createMock,
  deleteSavedCombinations: deleteManyMock,
}));

import { DELETE, GET, POST } from "./route";

const user = { userId: "65ab12cd34ef56ab78cd90ef" };
const combination = {
  id: "65ab12cd34ef56ab78cd9001",
  source: "manual",
  numbers: [1, 2, 3, 4, 5, 6],
};
const request = (method: string, body?: unknown) =>
  new Request("http://localhost/api/saved-combinations", {
    method,
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue(user);
  listMock.mockResolvedValue([combination]);
  createMock.mockResolvedValue(combination);
  deleteManyMock.mockResolvedValue(1);
});

it("lists only the signed-in user's combinations with private cache headers", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(listMock).toHaveBeenCalledWith(user.userId);
});

it("requires authentication for all saved-combination operations", async () => {
  getCurrentUserMock.mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect(
    (
      await POST(
        request("POST", { source: "manual", numbers: [1, 2, 3, 4, 5, 6] }),
      )
    ).status,
  ).toBe(401);
  expect((await DELETE(request("DELETE", { all: true }))).status).toBe(401);
  expect(createMock).not.toHaveBeenCalled();
  expect(deleteManyMock).not.toHaveBeenCalled();
});

it("creates a valid manually selected combination for the current user", async () => {
  const response = await POST(
    request("POST", { source: "manual", numbers: [6, 5, 4, 3, 2, 1] }),
  );
  expect(response.status).toBe(201);
  expect(createMock).toHaveBeenCalledWith(user.userId, {
    source: "manual",
    numbers: [6, 5, 4, 3, 2, 1],
  });
});

it("rejects duplicate or incomplete numbers before creating", async () => {
  const response = await POST(
    request("POST", { source: "manual", numbers: [1, 1, 2, 3, 4] }),
  );
  expect(response.status).toBe(400);
  expect(createMock).not.toHaveBeenCalled();
});

it("deletes selected or all combinations for the current user", async () => {
  expect(
    (await DELETE(request("DELETE", { ids: [combination.id] }))).status,
  ).toBe(204);
  expect(deleteManyMock).toHaveBeenLastCalledWith(user.userId, [
    combination.id,
  ]);
  expect((await DELETE(request("DELETE", { all: true }))).status).toBe(204);
  expect(deleteManyMock).toHaveBeenLastCalledWith(user.userId, undefined);
});
