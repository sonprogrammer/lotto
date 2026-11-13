import { ObjectId } from "mongodb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { setVapidMock, sendNotificationMock, dbMock, getMongoDbMock } =
  vi.hoisted(() => ({
    setVapidMock: vi.fn(),
    sendNotificationMock: vi.fn(),
    dbMock: { collection: vi.fn() },
    getMongoDbMock: vi.fn(),
  }));
vi.mock("web-push", () => ({
  setVapidDetails: setVapidMock,
  sendNotification: sendNotificationMock,
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import { sendPendingPushDeliveries } from "./send-pending-push-deliveries";

const userId = "65ab12cd34ef56ab78cd90ef";
const delivery = {
  _id: new ObjectId(),
  userId,
  notificationId: new ObjectId(),
  subscriptionId: new ObjectId(),
  status: "attempted",
  attemptedAt: new Date(),
  sentAt: null,
  failureCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const subscription = {
  _id: delivery.subscriptionId,
  userId,
  endpoint: "https://push.example/device",
  keys: { p256dh: "public", auth: "secret" },
};
const notice = { _id: delivery.notificationId, userId, status: "won" };
const collections = {
  push_deliveries: { findOneAndUpdate: vi.fn(), updateOne: vi.fn() },
  push_subscriptions: { findOne: vi.fn(), deleteOne: vi.fn() },
  notifications: { findOne: vi.fn() },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VAPID_PUBLIC_KEY", "public");
  vi.stubEnv("VAPID_PRIVATE_KEY", "private");
  vi.stubEnv("VAPID_SUBJECT", "mailto:admin@example.com");
  dbMock.collection.mockImplementation(
    (name: keyof typeof collections) => collections[name],
  );
  getMongoDbMock.mockResolvedValue(dbMock);
  collections.push_deliveries.findOneAndUpdate
    .mockResolvedValueOnce(delivery)
    .mockResolvedValueOnce(null);
  collections.push_deliveries.updateOne.mockResolvedValue({ matchedCount: 1 });
  collections.push_subscriptions.findOne.mockResolvedValue(subscription);
  collections.push_subscriptions.deleteOne.mockResolvedValue({
    deletedCount: 0,
  });
  collections.notifications.findOne.mockResolvedValue(notice);
  sendNotificationMock.mockResolvedValue(undefined);
});

afterEach(() => vi.unstubAllEnvs());

it("claims pending delivery before sending and never retries an attempted delivery", async () => {
  await expect(sendPendingPushDeliveries()).resolves.toEqual({
    sentCount: 1,
    failedCount: 0,
  });
  expect(collections.push_deliveries.findOneAndUpdate).toHaveBeenCalledWith(
    { status: "pending" },
    expect.objectContaining({
      $set: expect.objectContaining({ status: "attempted" }),
    }),
    { returnDocument: "after" },
  );
  expect(sendNotificationMock).toHaveBeenCalledOnce();
  expect(collections.push_deliveries.updateOne).toHaveBeenCalledWith(
    { _id: delivery._id, userId, status: "attempted" },
    expect.objectContaining({
      $set: expect.objectContaining({ status: "sent" }),
    }),
  );
});

it("removes expired device endpoints and records a non-retriable failure", async () => {
  sendNotificationMock.mockRejectedValue({ statusCode: 410 });
  await expect(sendPendingPushDeliveries()).resolves.toEqual({
    sentCount: 0,
    failedCount: 1,
  });
  expect(collections.push_subscriptions.deleteOne).toHaveBeenCalledWith({
    _id: delivery.subscriptionId,
    userId,
  });
  expect(collections.push_deliveries.updateOne).toHaveBeenCalledWith(
    { _id: delivery._id, userId, status: "attempted" },
    expect.objectContaining({
      $set: expect.objectContaining({
        status: "failed",
        failureCode: "http_410",
      }),
    }),
  );
});
