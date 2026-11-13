import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { collection, getMongoDbMock } = vi.hoisted(() => ({
  collection: {
    createIndex: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    insertOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
  getMongoDbMock: vi.fn(),
}));

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import {
  createSavedPrompt,
  deleteSavedPrompt,
  listSavedPrompts,
  SavedPromptLimitError,
  SavedPromptNotFoundError,
  updateSavedPrompt,
} from "./store";

const userId = "65ab12cd34ef56ab78cd90ef";
const promptId = new ObjectId("65ab12cd34ef56ab78cd9001");

function createDocument(overrides: Record<string, unknown> = {}) {
  return {
    _id: promptId,
    userId,
    title: "균형 조합",
    content: "홀짝과 구간을 고려해 주세요.",
    sortOrder: 0,
    createdAt: new Date("2026-11-08T00:00:00.000Z"),
    updatedAt: new Date("2026-11-08T00:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getMongoDbMock.mockResolvedValue({ collection: () => collection });
  collection.createIndex.mockResolvedValue("userId_1_sortOrder_1");
  collection.countDocuments.mockResolvedValue(0);
  collection.find.mockReturnValue({
    sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
  });
  collection.findOne.mockResolvedValue(null);
  collection.insertOne.mockResolvedValue({ insertedId: promptId });
  collection.findOneAndUpdate.mockResolvedValue(createDocument());
  collection.findOneAndDelete.mockResolvedValue(createDocument());
});

describe("listSavedPrompts", () => {
  it("lists only the requested user's prompts in sort order", async () => {
    const docs = [createDocument()];
    const toArray = vi.fn().mockResolvedValue(docs);
    const sort = vi.fn().mockReturnValue({ toArray });
    collection.find.mockReturnValue({ sort });

    const result = await listSavedPrompts(userId);

    expect(collection.find).toHaveBeenCalledWith({ userId });
    expect(sort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
    expect(result[0]).toMatchObject({
      id: promptId.toHexString(),
      title: "균형 조합",
      content: "홀짝과 구간을 고려해 주세요.",
    });
    expect(result[0]).not.toHaveProperty("userId");
  });
});

describe("createSavedPrompt", () => {
  it("stores the prompt under the current user and assigns the next order", async () => {
    collection.findOne.mockImplementation((query) =>
      Promise.resolve(
        query.sortOrder === 0 ? createDocument({ sortOrder: 0 }) : null,
      ),
    );

    const result = await createSavedPrompt(userId, {
      title: "균형 조합",
      content: "홀짝과 구간을 고려해 주세요.",
    });

    expect(collection.createIndex).toHaveBeenCalledWith(
      { userId: 1, sortOrder: 1 },
      { unique: true },
    );
    expect(collection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId, sortOrder: 1 }),
    );
    expect(result.title).toBe("균형 조합");
  });

  it("rejects a sixth prompt for the same user", async () => {
    collection.findOne.mockImplementation((query) =>
      Promise.resolve(createDocument({ sortOrder: query.sortOrder })),
    );

    await expect(
      createSavedPrompt(userId, {
        title: "여섯 번째",
        content: "추가 프롬프트",
      }),
    ).rejects.toBeInstanceOf(SavedPromptLimitError);
    expect(collection.insertOne).not.toHaveBeenCalled();
  });

  it("retries a sort slot if another device creates it concurrently", async () => {
    collection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createDocument({ sortOrder: 0 }))
      .mockResolvedValueOnce(null);
    collection.insertOne
      .mockRejectedValueOnce({ code: 11000 })
      .mockResolvedValueOnce({ insertedId: promptId });

    await createSavedPrompt(userId, {
      title: "다섯 번째",
      content: "저장 의견",
    });

    expect(collection.insertOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sortOrder: 0 }),
    );
    expect(collection.insertOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ sortOrder: 1 }),
    );
  });
});

describe("updateSavedPrompt", () => {
  it("filters by both user and prompt id", async () => {
    await updateSavedPrompt(userId, promptId.toHexString(), {
      title: "수정된 제목",
    });

    expect(collection.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: promptId, userId },
      {
        $set: expect.objectContaining({
          title: "수정된 제목",
          updatedAt: expect.any(Date),
        }),
      },
      { returnDocument: "after" },
    );
  });

  it("does not distinguish a missing prompt from one owned by another user", async () => {
    collection.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      updateSavedPrompt(userId, promptId.toHexString(), { title: "변경" }),
    ).rejects.toBeInstanceOf(SavedPromptNotFoundError);
  });
});

describe("deleteSavedPrompt", () => {
  it("deletes only a prompt owned by the current user", async () => {
    await deleteSavedPrompt(userId, promptId.toHexString());

    expect(collection.findOneAndDelete).toHaveBeenCalledWith({
      _id: promptId,
      userId,
    });
  });

  it("reports missing and foreign prompts as not found", async () => {
    collection.findOneAndDelete.mockResolvedValue(null);

    await expect(
      deleteSavedPrompt(userId, promptId.toHexString()),
    ).rejects.toBeInstanceOf(SavedPromptNotFoundError);
  });
});
