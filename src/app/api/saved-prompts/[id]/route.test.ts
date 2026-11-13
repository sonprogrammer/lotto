import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, updateSavedPromptMock, deleteSavedPromptMock } =
  vi.hoisted(() => ({
    getCurrentUserMock: vi.fn(),
    updateSavedPromptMock: vi.fn(),
    deleteSavedPromptMock: vi.fn(),
  }));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/saved-prompt/server/store", () => ({
  updateSavedPrompt: updateSavedPromptMock,
  deleteSavedPrompt: deleteSavedPromptMock,
  SavedPromptNotFoundError: class SavedPromptNotFoundError extends Error {},
}));

import { DELETE, PATCH } from "./route";

const user = { userId: "65ab12cd34ef56ab78cd90ef", nickname: "진" };
const id = "65ab12cd34ef56ab78cd9001";
const context = { params: Promise.resolve({ id }) };
const prompt = {
  id,
  title: "수정된 제목",
  content: "홀짝을 고려해 주세요.",
  sortOrder: 0,
  createdAt: "2026-11-08T00:00:00.000Z",
  updatedAt: "2026-11-09T00:00:00.000Z",
};

function createRequest(body: unknown) {
  return new Request(`http://localhost/api/saved-prompts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue(user);
  updateSavedPromptMock.mockResolvedValue(prompt);
  deleteSavedPromptMock.mockResolvedValue(undefined);
});

it("updates a prompt with the current user's id", async () => {
  const response = await PATCH(
    createRequest({ title: "수정된 제목" }),
    context,
  );

  expect(response.status).toBe(200);
  expect(updateSavedPromptMock).toHaveBeenCalledWith(user.userId, id, {
    title: "수정된 제목",
  });
  expect(response.headers.get("Cache-Control")).toContain("no-store");
});

it("rejects empty updates and invalid ids", async () => {
  const emptyResponse = await PATCH(createRequest({}), context);
  const invalidResponse = await PATCH(createRequest({ title: "새 제목" }), {
    params: Promise.resolve({ id: "invalid" }),
  });

  expect(emptyResponse.status).toBe(400);
  expect(invalidResponse.status).toBe(400);
  expect(updateSavedPromptMock).not.toHaveBeenCalled();
});

it("returns not found for a prompt the current user does not own", async () => {
  const { SavedPromptNotFoundError } =
    await import("@/entities/saved-prompt/server/store");
  updateSavedPromptMock.mockRejectedValue(new SavedPromptNotFoundError());

  const response = await PATCH(createRequest({ title: "수정" }), context);

  expect(response.status).toBe(404);
});

it("deletes a prompt for the current user", async () => {
  const request = new Request(`http://localhost/api/saved-prompts/${id}`, {
    method: "DELETE",
  });

  const response = await DELETE(request, context);

  expect(response.status).toBe(204);
  expect(deleteSavedPromptMock).toHaveBeenCalledWith(user.userId, id);
});

it("requires authentication before changing a prompt", async () => {
  getCurrentUserMock.mockResolvedValue(null);
  const request = new Request(`http://localhost/api/saved-prompts/${id}`, {
    method: "DELETE",
  });

  const response = await DELETE(request, context);

  expect(response.status).toBe(401);
  expect(deleteSavedPromptMock).not.toHaveBeenCalled();
});
