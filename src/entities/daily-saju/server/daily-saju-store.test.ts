import { ObjectId } from "mongodb";
import { beforeEach, expect, it, vi } from "vitest";

const { collection, getMongoDbMock } = vi.hoisted(() => ({
  collection: {
    createIndex: vi.fn(),
    insertOne: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
  },
  getMongoDbMock: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import {
  claimDailyRecommendation,
  completeDailyRecommendation,
  deleteDailyRecommendations,
  releaseDailyRecommendationClaim,
} from "./daily-saju-store";

const userId = "65ab12cd34ef56ab78cd90ef";
const dateKey = "2026-11-14";
const now = new Date("2026-11-14T12:00:00.000Z");
const pending = {
  _id: new ObjectId("65ab12cd34ef56ab78cd9001"),
  userId,
  dateKey,
  status: "generating" as const,
  leaseExpiresAt: new Date(now.getTime() + 30_000),
  createdAt: now,
  updatedAt: now,
};

beforeEach(() => {
  vi.clearAllMocks();
  getMongoDbMock.mockResolvedValue({ collection: () => collection });
  collection.createIndex.mockResolvedValue("index");
  collection.insertOne.mockResolvedValue({ acknowledged: true });
  collection.findOne.mockResolvedValue(pending);
  collection.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
  collection.deleteOne.mockResolvedValue({ deletedCount: 1 });
  collection.deleteMany.mockResolvedValue({ deletedCount: 2 });
});

it("creates one unique per-user per-KST-day index and claims a fresh date", async () => {
  const claim = await claimDailyRecommendation(userId, dateKey, now);
  expect(collection.createIndex).toHaveBeenCalledWith(
    { userId: 1, dateKey: 1 },
    { unique: true },
  );
  expect(collection.insertOne).toHaveBeenCalledWith(
    expect.objectContaining({
      userId,
      dateKey,
      status: "generating",
      leaseExpiresAt: new Date(now.getTime() + 30_000),
    }),
  );
  expect(claim).toMatchObject({ acquired: true });
});

it("returns an existing active generation when another request owns the claim", async () => {
  collection.insertOne.mockRejectedValue({ code: 11000 });
  const claim = await claimDailyRecommendation(userId, dateKey, now);
  expect(claim).toMatchObject({ acquired: false, recommendation: pending });
  expect(collection.updateOne).not.toHaveBeenCalled();
});

it("allows only one of two concurrent requests to acquire the same day", async () => {
  let insertCount = 0;
  collection.insertOne.mockImplementation(async () => {
    insertCount += 1;
    if (insertCount === 1) return { acknowledged: true };
    throw { code: 11000 };
  });
  const claims = await Promise.all([
    claimDailyRecommendation(userId, dateKey, now),
    claimDailyRecommendation(userId, dateKey, now),
  ]);
  expect(claims.filter((claim) => claim.acquired)).toHaveLength(1);
  expect(claims.filter((claim) => !claim.acquired)).toHaveLength(1);
});

it("takes over an expired generation with a compare-and-set lease", async () => {
  collection.insertOne.mockRejectedValue({ code: 11000 });
  collection.findOne.mockResolvedValue({
    ...pending,
    leaseExpiresAt: new Date(now.getTime() - 1),
  });
  collection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  const claim = await claimDailyRecommendation(userId, dateKey, now);
  expect(collection.updateOne).toHaveBeenCalledWith(
    expect.objectContaining({
      userId,
      dateKey,
      status: "generating",
      leaseExpiresAt: { $lte: now },
    }),
    expect.objectContaining({
      $set: expect.objectContaining({
        leaseExpiresAt: new Date(now.getTime() + 30_000),
      }),
    }),
  );
  expect(claim).toMatchObject({ acquired: true });
});

it("completes and releases only the matching lease, and deletes all history for one user", async () => {
  const lease = pending.leaseExpiresAt;
  collection.findOne.mockResolvedValue({
    ...pending,
    status: "ready",
    number: 23,
    explanation: "오늘의 일진을 참고한 숫자입니다.",
    leaseExpiresAt: undefined,
  });
  await completeDailyRecommendation(userId, dateKey, lease, {
    number: 23,
    explanation: "오늘의 일진을 참고한 숫자입니다.",
  });
  expect(collection.updateOne).toHaveBeenCalledWith(
    { userId, dateKey, status: "generating", leaseExpiresAt: lease },
    expect.any(Object),
  );
  await releaseDailyRecommendationClaim(userId, dateKey, lease);
  expect(collection.deleteOne).toHaveBeenCalledWith({
    userId,
    dateKey,
    status: "generating",
    leaseExpiresAt: lease,
  });
  await deleteDailyRecommendations(userId);
  expect(collection.deleteMany).toHaveBeenCalledWith({ userId });
});
