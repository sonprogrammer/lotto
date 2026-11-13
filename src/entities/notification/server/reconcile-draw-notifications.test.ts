import { ObjectId } from "mongodb";
import { beforeEach, expect, it, vi } from "vitest";

const { dbCollections, getMongoDbMock } = vi.hoisted(() => ({
  dbCollections: {} as Record<string, Record<string, ReturnType<typeof vi.fn>>>,
  getMongoDbMock: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import { reconcileDrawNotifications } from "./reconcile-draw-notifications";

const userId = "65ab12cd34ef56ab78cd90ef";
const combinationId = new ObjectId("65ab12cd34ef56ab78cd9001");
const notificationId = new ObjectId("65ab12cd34ef56ab78cd9002");
const subscriptionId = new ObjectId("65ab12cd34ef56ab78cd9003");
const round = 1250;
const saved = {
  _id: combinationId,
  userId,
  drawResults: [
    {
      roundNumber: round,
      drawDate: new Date(),
      rank: 4,
      amountPerWinner: 50_000,
    },
  ],
};
const notice = {
  _id: notificationId,
  userId,
  savedCombinationId: combinationId,
  roundNumber: round,
  drawDate: saved.drawResults[0].drawDate,
  status: "won",
  rank: 4,
  amountPerWinner: 50_000,
  readAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  const draws = { findOne: vi.fn().mockResolvedValue({ roundNumber: round }) };
  const combinations = {
    find: vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([saved]) }),
  };
  const notifications = {
    createIndex: vi.fn(),
    findOne: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(notice),
    updateOne: vi.fn().mockResolvedValue({ upsertedCount: 1, matchedCount: 0 }),
  };
  const subscriptions = {
    find: vi.fn().mockReturnValue({
      toArray: vi
        .fn()
        .mockResolvedValue([
          { _id: subscriptionId, userId, createdAt: new Date(0) },
        ]),
    }),
  };
  const deliveries = {
    createIndex: vi.fn(),
    updateOne: vi.fn().mockResolvedValue({ upsertedCount: 1 }),
  };
  Object.assign(dbCollections, {
    lottery_draws: draws,
    saved_combinations: combinations,
    notifications,
    push_subscriptions: subscriptions,
    push_deliveries: deliveries,
  });
  getMongoDbMock.mockResolvedValue({
    collection: (name: string) => dbCollections[name],
  });
});

it("creates one latest-round win notice and one pending delivery per active device", async () => {
  await expect(
    reconcileDrawNotifications({ latestRound: round }),
  ).resolves.toEqual({ createdCount: 1, updatedCount: 0 });
  expect(dbCollections.notifications.updateOne).toHaveBeenCalledWith(
    { userId, savedCombinationId: combinationId, roundNumber: round },
    expect.objectContaining({
      $setOnInsert: expect.objectContaining({ userId, readAt: null }),
    }),
    { upsert: true },
  );
  expect(dbCollections.push_deliveries.updateOne).toHaveBeenCalledWith(
    { notificationId, subscriptionId },
    expect.objectContaining({
      $setOnInsert: expect.objectContaining({ userId, status: "pending" }),
    }),
    { upsert: true },
  );
});

it("does not create historical notifications for non-winning combinations", async () => {
  dbCollections.saved_combinations.find.mockReturnValue({
    toArray: async () => [
      {
        ...saved,
        drawResults: [
          { ...saved.drawResults[0], rank: null, amountPerWinner: 0 },
        ],
      },
    ],
  });
  await expect(
    reconcileDrawNotifications({ latestRound: round }),
  ).resolves.toEqual({ createdCount: 0, updatedCount: 0 });
  expect(dbCollections.notifications.updateOne).not.toHaveBeenCalled();
});

it("marks a previous win corrected without creating a new notice or push", async () => {
  const notifications = dbCollections.notifications;
  notifications.findOne
    .mockReset()
    .mockResolvedValueOnce(notice)
    .mockResolvedValueOnce({
      ...notice,
      status: "corrected",
      rank: null,
      amountPerWinner: 0,
    });
  notifications.updateOne.mockResolvedValue({
    matchedCount: 1,
    upsertedCount: 0,
  });
  dbCollections.saved_combinations.find.mockReturnValue({
    toArray: async () => [
      {
        ...saved,
        drawResults: [
          { ...saved.drawResults[0], rank: null, amountPerWinner: 0 },
        ],
      },
    ],
  });

  await expect(
    reconcileDrawNotifications({ latestRound: round }),
  ).resolves.toEqual({ createdCount: 0, updatedCount: 1 });
  expect(notifications.updateOne).toHaveBeenCalledWith(
    { userId, savedCombinationId: combinationId, roundNumber: round },
    expect.objectContaining({
      $set: expect.objectContaining({
        status: "corrected",
        rank: null,
        amountPerWinner: 0,
      }),
    }),
    { upsert: false },
  );
  expect(dbCollections.push_subscriptions.find).not.toHaveBeenCalled();
});
