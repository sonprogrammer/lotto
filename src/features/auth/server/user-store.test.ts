import { beforeEach, expect, it, vi } from "vitest";
import { findOrCreateKakaoUser } from "./user-store";

const db = vi.hoisted(() => ({
  createIndex: vi.fn(),
  findOneAndUpdate: vi.fn(),
  findOne: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({ collection: () => db }),
}));
beforeEach(() => vi.clearAllMocks());

it("uses a unique Kakao ID and atomic insert-only upsert for concurrent logins", async () => {
  db.findOneAndUpdate.mockResolvedValue({
    _id: { toHexString: () => "user-id" },
    kakaoId: "123",
    createdAt: new Date(),
  });
  expect(await findOrCreateKakaoUser("123")).toEqual({ userId: "user-id" });
  expect(db.createIndex).toHaveBeenCalledWith({ kakaoId: 1 }, { unique: true });
  expect(db.findOneAndUpdate).toHaveBeenCalledWith(
    { kakaoId: "123" },
    { $setOnInsert: { kakaoId: "123", createdAt: expect.any(Date) } },
    { upsert: true, returnDocument: "after" },
  );
});

it("returns the existing user when a racing upsert hits the unique constraint", async () => {
  db.findOneAndUpdate.mockRejectedValue({ code: 11000 });
  db.findOne.mockResolvedValue({
    _id: { toHexString: () => "existing-id" },
    kakaoId: "123",
    createdAt: new Date(),
  });
  expect(await findOrCreateKakaoUser("123")).toEqual({ userId: "existing-id" });
  expect(db.findOne).toHaveBeenCalledWith({ kakaoId: "123" });
});

it("propagates storage errors", async () => {
  db.findOneAndUpdate.mockRejectedValue(new Error("unavailable"));
  await expect(findOrCreateKakaoUser("123")).rejects.toThrow("unavailable");
});
