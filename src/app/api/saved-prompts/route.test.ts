import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, listSavedPromptsMock, createSavedPromptMock } =
  vi.hoisted(() => ({
    getCurrentUserMock: vi.fn(),
    listSavedPromptsMock: vi.fn(),
    createSavedPromptMock: vi.fn(),
  }));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/saved-prompt/server/store", () => ({
  listSavedPrompts: listSavedPromptsMock,
  createSavedPrompt: createSavedPromptMock,
  SavedPromptLimitError: class SavedPromptLimitError extends Error {},
}));

import { GET, POST } from "./route";

const user = { userId: "65ab12cd34ef56ab78cd90ef", nickname: "진" };
const prompt = {
  id: "65ab12cd34ef56ab78cd9001",
  title: "균형 조합",
  content: "홀짝을 고려해 주세요.",
  sortOrder: 0,
  createdAt: "2026-11-08T00:00:00.000Z",
  updatedAt: "2026-11-08T00:00:00.000Z",
};

function createRequest(body: unknown) {
  return new Request("http://localhost/api/saved-prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue(user);
  listSavedPromptsMock.mockResolvedValue([prompt]);
  createSavedPromptMock.mockResolvedValue(prompt);
});

it("returns the signed-in user's prompts without shared caching", async () => {
  const response = await GET();

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(listSavedPromptsMock).toHaveBeenCalledWith(user.userId);
  expect(await response.json()).toEqual([prompt]);
});

it("requires authentication before listing or creating prompts", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  const listResponse = await GET();
  const createResponse = await POST(
    createRequest({ title: "제목", content: "내용" }),
  );

  expect(listResponse.status).toBe(401);
  expect(createResponse.status).toBe(401);
  expect(listSavedPromptsMock).not.toHaveBeenCalled();
  expect(createSavedPromptMock).not.toHaveBeenCalled();
});

it("creates a prompt for the current user", async () => {
  const response = await POST(
    createRequest({ title: " 균형 조합 ", content: " 홀짝을 고려해 주세요. " }),
  );

  expect(response.status).toBe(201);
  expect(createSavedPromptMock).toHaveBeenCalledWith(user.userId, {
    title: "균형 조합",
    content: "홀짝을 고려해 주세요.",
  });
  expect(await response.json()).toEqual(prompt);
});

it("rejects invalid prompt data before writing", async () => {
  const response = await POST(createRequest({ title: "", content: "내용" }));

  expect(response.status).toBe(400);
  expect(createSavedPromptMock).not.toHaveBeenCalled();
});

it("explains when the user has reached the five-prompt limit", async () => {
  const { SavedPromptLimitError } =
    await import("@/entities/saved-prompt/server/store");
  createSavedPromptMock.mockRejectedValue(new SavedPromptLimitError());

  const response = await POST(
    createRequest({ title: "제목", content: "내용" }),
  );

  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ error: expect.any(String) });
});
