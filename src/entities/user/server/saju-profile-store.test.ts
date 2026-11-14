import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { collection, getMongoDbMock } = vi.hoisted(() => ({
  collection: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
  getMongoDbMock: vi.fn(),
}));

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import {
  getSajuProfile,
  removeSajuProfile,
  saveSajuProfile,
  SajuProfileUserNotFoundError,
} from "./saju-profile-store";

const userId = "65ab12cd34ef56ab78cd90ef";
const userObjectId = new ObjectId(userId);
const createdAt = new Date("2026-11-01T00:00:00.000Z");
const input = {
  displayName: "아빠",
  birthDate: "1980-04-12",
  calendarType: "lunar" as const,
  isLeapMonth: true,
  birthTime: "08:30",
};

function createProfile(overrides: Record<string, unknown> = {}) {
  return {
    ...input,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getMongoDbMock.mockResolvedValue({ collection: () => collection });
  collection.findOne.mockResolvedValue({ sajuProfile: createProfile() });
  collection.findOneAndUpdate.mockResolvedValue({
    sajuProfile: createProfile({
      updatedAt: new Date("2026-11-14T00:00:00.000Z"),
    }),
  });
});

it("removes only the authenticated user's saju profile", async () => {
  collection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  await expect(removeSajuProfile(userId)).resolves.toBe(true);
  expect(collection.updateOne).toHaveBeenCalledWith(
    { _id: userObjectId },
    { $unset: { sajuProfile: "" } },
  );
});

describe("getSajuProfile", () => {
  it("reads the profile only from the requested user's document", async () => {
    const profile = await getSajuProfile(userId);

    expect(collection.findOne).toHaveBeenCalledWith({ _id: userObjectId });
    expect(profile).toEqual(createProfile());
  });

  it("returns null when the user has not registered a profile", async () => {
    collection.findOne.mockResolvedValue({ _id: userObjectId });

    await expect(getSajuProfile(userId)).resolves.toBeNull();
  });

  it("does not query MongoDB for a malformed user id", async () => {
    await expect(getSajuProfile("someone-else")).resolves.toBeNull();
    expect(collection.findOne).not.toHaveBeenCalled();
  });
});

describe("saveSajuProfile", () => {
  it("updates only the authenticated user's embedded profile", async () => {
    collection.findOne.mockResolvedValue({ _id: userObjectId });
    collection.findOneAndUpdate.mockImplementation((_query, update) =>
      Promise.resolve({
        sajuProfile: {
          ...update.$set.sajuProfile,
        },
      }),
    );

    const result = await saveSajuProfile(userId, input);

    expect(collection.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userObjectId },
      {
        $set: {
          sajuProfile: expect.objectContaining({
            ...input,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        },
      },
      { returnDocument: "after" },
    );
    expect(result).toMatchObject(input);
  });

  it("preserves the profile creation timestamp when updating it", async () => {
    collection.findOne.mockResolvedValue({ sajuProfile: createProfile() });
    collection.findOneAndUpdate.mockImplementation((_query, update) =>
      Promise.resolve({ sajuProfile: update.$set.sajuProfile }),
    );

    const result = await saveSajuProfile(userId, {
      ...input,
      displayName: "아버지",
    });

    expect(result.createdAt).toEqual(createdAt);
    expect(result.updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
  });

  it("does not change any other user's profile", async () => {
    await saveSajuProfile(userId, input);

    expect(collection.findOneAndUpdate.mock.calls[0][0]).toEqual({
      _id: userObjectId,
    });
  });

  it("reports a user document that no longer exists", async () => {
    collection.findOne.mockResolvedValue(null);
    collection.findOneAndUpdate.mockResolvedValue(null);

    await expect(saveSajuProfile(userId, input)).rejects.toBeInstanceOf(
      SajuProfileUserNotFoundError,
    );
  });
});
