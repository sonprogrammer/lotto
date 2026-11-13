import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, updateMock, deleteMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/saved-combination/server/store", () => ({
  updateSavedCombination: updateMock,
  deleteSavedCombination: deleteMock,
  SavedCombinationNotFoundError: class SavedCombinationNotFoundError extends Error {},
}));

import { DELETE, PATCH } from "./route";

const id = "65ab12cd34ef56ab78cd9001";
const user = { userId: "65ab12cd34ef56ab78cd90ef" };
const context = { params: Promise.resolve({ id }) };
const request = (method: string, body?: unknown) =>
  new Request(`http://localhost/api/saved-combinations/${id}`, {
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
  updateMock.mockResolvedValue({ id, numbers: [1, 2, 3, 4, 5, 6] });
  deleteMock.mockResolvedValue(undefined);
});

it("updates a combination for the current user", async () => {
  const response = await PATCH(
    request("PATCH", { numbers: [1, 2, 3, 4, 5, 6] }),
    context,
  );
  expect(response.status).toBe(200);
  expect(updateMock).toHaveBeenCalledWith(user.userId, id, [1, 2, 3, 4, 5, 6]);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
});

it("rejects incomplete updates and invalid IDs before writing", async () => {
  const invalidIdContext = { params: Promise.resolve({ id: "bad-id" }) };
  expect(
    (await PATCH(request("PATCH", { numbers: [1, 2] }), context)).status,
  ).toBe(400);
  expect(
    (
      await PATCH(
        request("PATCH", { numbers: [1, 2, 3, 4, 5, 6] }),
        invalidIdContext,
      )
    ).status,
  ).toBe(400);
  expect(updateMock).not.toHaveBeenCalled();
});

it("deletes by id and requires authentication", async () => {
  expect((await DELETE(request("DELETE"), context)).status).toBe(204);
  expect(deleteMock).toHaveBeenCalledWith(user.userId, id);
  getCurrentUserMock.mockResolvedValue(null);
  expect((await DELETE(request("DELETE"), context)).status).toBe(401);
  expect(deleteMock).toHaveBeenCalledTimes(1);
});
