import { beforeEach, expect, it, vi } from "vitest";

const { collection, getMongoDbMock } = vi.hoisted(() => ({
  collection: { createIndex: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn() },
  getMongoDbMock: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import {
  deletePushSubscription,
  upsertPushSubscription,
} from "./push-subscription-store";

beforeEach(() => {
  vi.clearAllMocks();
  getMongoDbMock.mockResolvedValue({ collection: () => collection });
  collection.createIndex.mockResolvedValue("endpoint_1");
  collection.updateOne.mockResolvedValue({ upsertedCount: 1 });
  collection.deleteOne.mockResolvedValue({ deletedCount: 1 });
});

it("upserts endpoint ownership and its keys with a unique endpoint index", async () => {
  const subscription = {
    endpoint: "https://push.example/device",
    keys: { p256dh: "public", auth: "private" },
    userAgent: "test",
  };
  await upsertPushSubscription("65ab12cd34ef56ab78cd90ef", subscription);
  expect(collection.createIndex).toHaveBeenCalledWith(
    { endpoint: 1 },
    { unique: true },
  );
  expect(collection.updateOne).toHaveBeenCalledWith(
    { endpoint: subscription.endpoint },
    expect.objectContaining({
      $set: expect.objectContaining({
        userId: "65ab12cd34ef56ab78cd90ef",
        keys: subscription.keys,
      }),
    }),
    { upsert: true },
  );
});

it("deletes an endpoint only for the authenticated owner", async () => {
  await deletePushSubscription(
    "65ab12cd34ef56ab78cd90ef",
    "https://push.example/device",
  );
  expect(collection.deleteOne).toHaveBeenCalledWith({
    userId: "65ab12cd34ef56ab78cd90ef",
    endpoint: "https://push.example/device",
  });
});
