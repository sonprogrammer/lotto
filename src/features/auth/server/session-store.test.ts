import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAppSession,
  deleteAppSession,
  findActiveAppSession,
} from "./session-store";

const db = vi.hoisted(() => ({
  createIndex: vi.fn(),
  insertOne: vi.fn(),
  findOne: vi.fn(),
  deleteOne: vi.fn(),
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({ collection: () => db }),
}));
const now = new Date("2026-11-08T00:00:00.000Z");
beforeEach(() => vi.clearAllMocks());

describe("app sessions", () => {
  it("stores only a SHA-256 hash of a unique 32-byte secret for 30 days", async () => {
    const token = await createAppSession("user-1", now);
    const other = await createAppSession("user-1", now);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(other).not.toBe(token);
    expect(db.insertOne).toHaveBeenCalledWith({
      userId: "user-1",
      tokenHash: createHash("sha256").update(token).digest("hex"),
      createdAt: now,
      expiresAt: new Date("2026-12-08T00:00:00.000Z"),
    });
    expect(db.createIndex).toHaveBeenCalledWith(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
    expect(db.createIndex).toHaveBeenCalledWith(
      { tokenHash: 1 },
      { unique: true },
    );
  });

  it("looks up the hash and requires an expiry strictly after the request time", async () => {
    db.findOne.mockResolvedValue({
      userId: "user-1",
      tokenHash: "stored",
      expiresAt: new Date("2026-12-08"),
    });
    expect(await findActiveAppSession("secret", now)).toEqual({
      userId: "user-1",
    });
    expect(db.findOne).toHaveBeenCalledWith({
      tokenHash:
        "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b",
      expiresAt: { $gt: now },
    });
  });

  it.each([new Date("2026-11-07"), now])(
    "rejects expired sessions even before TTL cleanup (%s)",
    async (expiresAt) => {
      db.findOne.mockResolvedValue({ userId: "user-1", expiresAt });
      expect(await findActiveAppSession("expired", now)).toBeNull();
    },
  );

  it("returns null for an unknown token", async () => {
    db.findOne.mockResolvedValue(null);
    expect(await findActiveAppSession("unknown", now)).toBeNull();
  });

  it("deletes the current session using its hash", async () => {
    await deleteAppSession("secret");
    expect(db.deleteOne).toHaveBeenCalledWith({
      tokenHash:
        "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b",
    });
  });
});
