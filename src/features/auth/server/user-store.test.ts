import { beforeEach, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { findKakaoUserById, findOrCreateKakaoUser } from "./user-store";

const db = vi.hoisted(() => ({
  createIndex: vi.fn(),
  findOneAndUpdate: vi.fn(),
  findOne: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({ collection: () => db }),
}));
beforeEach(() => vi.clearAllMocks());

it("uses a unique Kakao ID and atomic upsert to refresh the nickname", async () => {
  const userId = new ObjectId();
  db.findOneAndUpdate.mockResolvedValue({
    _id: userId,
    kakaoId: "123",
    nickname: "손영진",
    createdAt: new Date(),
  });
  expect(await findOrCreateKakaoUser("123", "손영진")).toEqual({
    userId: userId.toHexString(),
  });
  expect(db.createIndex).toHaveBeenCalledWith({ kakaoId: 1 }, { unique: true });
  expect(db.findOneAndUpdate).toHaveBeenCalledWith(
    { kakaoId: "123" },
    {
      $set: { nickname: "손영진" },
      $setOnInsert: { kakaoId: "123", createdAt: expect.any(Date) },
    },
    { upsert: true, returnDocument: "after" },
  );
});

it("returns the existing user when a racing upsert hits the unique constraint", async () => {
  const userId = new ObjectId();
  db.findOneAndUpdate.mockRejectedValue({ code: 11000 });
  db.findOne.mockResolvedValue({
    _id: userId,
    kakaoId: "123",
    nickname: "손영진",
    createdAt: new Date(),
  });
  expect(await findOrCreateKakaoUser("123", "손영진")).toEqual({
    userId: userId.toHexString(),
  });
  expect(db.findOne).toHaveBeenCalledWith({ kakaoId: "123" });
});

it("propagates storage errors", async () => {
  db.findOneAndUpdate.mockRejectedValue(new Error("unavailable"));
  await expect(findOrCreateKakaoUser("123", "손영진")).rejects.toThrow(
    "unavailable",
  );
});

it("loads a stored nickname by the authenticated user ID", async () => {
  const userId = new ObjectId().toHexString();
  db.findOne.mockResolvedValue({
    _id: new ObjectId(userId),
    kakaoId: "123",
    nickname: "손영진",
    createdAt: new Date(),
  });

  await expect(findKakaoUserById(userId)).resolves.toEqual({
    nickname: "손영진",
  });
  expect(db.findOne).toHaveBeenCalledWith({ _id: new ObjectId(userId) });
});

it("returns no nickname for a legacy user until the next Kakao login", async () => {
  const userId = new ObjectId().toHexString();
  db.findOne.mockResolvedValue({
    _id: new ObjectId(userId),
    kakaoId: "123",
    createdAt: new Date(),
  });

  await expect(findKakaoUserById(userId)).resolves.toBeNull();
});

it("does not query MongoDB for an invalid user ID", async () => {
  await expect(findKakaoUserById("not-an-object-id")).resolves.toBeNull();
  expect(db.findOne).not.toHaveBeenCalled();
});
