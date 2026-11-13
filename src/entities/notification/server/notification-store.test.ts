import { ObjectId } from "mongodb";
import { beforeEach, expect, it, vi } from "vitest";

const { collection, getMongoDbMock } = vi.hoisted(() => ({
  collection: {
    createIndex: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  getMongoDbMock: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import {
  countUnreadNotifications,
  listNotifications,
  markNotificationRead,
} from "./notification-store";

const userId = "65ab12cd34ef56ab78cd90ef";
const notification = {
  _id: new ObjectId("65ab12cd34ef56ab78cd9001"),
  userId,
  savedCombinationId: new ObjectId("65ab12cd34ef56ab78cd9002"),
  roundNumber: 1250,
  drawDate: new Date("2026-11-07T00:00:00.000Z"),
  status: "won" as const,
  rank: 4 as const,
  amountPerWinner: 50_000,
  readAt: null,
  createdAt: new Date("2026-11-08T00:00:00.000Z"),
  updatedAt: new Date("2026-11-08T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  getMongoDbMock.mockResolvedValue({ collection: () => collection });
  collection.createIndex.mockResolvedValue("index");
  collection.countDocuments.mockResolvedValue(1);
  collection.find.mockReturnValue({
    sort: () => ({
      skip: () => ({ limit: () => ({ toArray: async () => [notification] }) }),
    }),
  });
  collection.findOneAndUpdate.mockResolvedValue(notification);
});

it("lists recent notifications under the requested user and reports unread count", async () => {
  const result = await listNotifications(userId, 1, 20);
  expect(collection.find).toHaveBeenCalledWith({ userId });
  expect(result.items[0]).toMatchObject({
    id: notification._id.toHexString(),
    status: "won",
    rank: 4,
  });
  expect(await countUnreadNotifications(userId)).toBe(1);
  expect(collection.countDocuments).toHaveBeenCalledWith({
    userId,
    readAt: null,
  });
});

it("marks read only when both notification id and current user match", async () => {
  const id = notification._id.toHexString();
  await markNotificationRead(userId, id);
  expect(collection.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: notification._id, userId },
    expect.any(Array),
    { returnDocument: "after" },
  );
  expect(await markNotificationRead(userId, "invalid")).toBeNull();
});
