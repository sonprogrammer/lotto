import { ObjectId } from "mongodb";
import { beforeEach, expect, it, vi } from "vitest";

const { collection, getMongoDbMock } = vi.hoisted(() => ({
  collection: { findOne: vi.fn(), countDocuments: vi.fn() },
  getMongoDbMock: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import { getSavedCombinationPage } from "./store";

const userId = "65ab12cd34ef56ab78cd90ef";
const targetId = new ObjectId("65ab12cd34ef56ab78cd9001");
const createdAt = new Date("2026-11-10T00:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  getMongoDbMock.mockResolvedValue({ collection: () => collection });
  collection.findOne.mockResolvedValue({ _id: targetId, createdAt });
  collection.countDocuments.mockResolvedValue(11);
});

it("calculates the target page in the saved list's descending order", async () => {
  await expect(
    getSavedCombinationPage(userId, targetId.toHexString(), 10),
  ).resolves.toBe(2);
  expect(collection.findOne).toHaveBeenCalledWith(
    { _id: targetId, userId },
    { projection: { createdAt: 1, _id: 1 } },
  );
  expect(collection.countDocuments).toHaveBeenCalledWith({
    userId,
    $or: [
      { createdAt: { $gt: createdAt } },
      { createdAt, _id: { $gt: targetId } },
    ],
  });
});

it("does not reveal or paginate combinations owned by another account", async () => {
  collection.findOne.mockResolvedValue(null);
  await expect(
    getSavedCombinationPage(userId, targetId.toHexString(), 10),
  ).resolves.toBeNull();
  expect(collection.countDocuments).not.toHaveBeenCalled();
});
