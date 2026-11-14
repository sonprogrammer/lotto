import { beforeEach, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getCurrentUser: vi.fn(),
    getKstDateKey: vi.fn(),
    getSajuProfile: vi.fn(),
    saveSajuProfile: vi.fn(),
    deleteSajuProfile: vi.fn(),
  },
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/features/daily-saju/lib/get-kst-date-key", () => ({
  getKstDateKey: mocks.getKstDateKey,
}));
vi.mock("@/entities/user/server/saju-profile-store", () => ({
  getSajuProfile: mocks.getSajuProfile,
  saveSajuProfile: mocks.saveSajuProfile,
}));
vi.mock("@/features/daily-saju/server/delete-saju-profile", () => ({
  deleteSajuProfile: mocks.deleteSajuProfile,
  SajuProfileNotFoundError: class SajuProfileNotFoundError extends Error {
    name = "SajuProfileNotFoundError";
  },
}));

import { DELETE, GET, PUT } from "./route";

const userId = "65ab12cd34ef56ab78cd90ef";
const profile = {
  birthDate: "1980-04-12",
  calendarType: "solar",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ userId });
  mocks.getKstDateKey.mockReturnValue("2026-11-14");
  mocks.getSajuProfile.mockResolvedValue(profile);
  mocks.saveSajuProfile.mockResolvedValue(profile);
  mocks.deleteSajuProfile.mockResolvedValue(undefined);
});

it("loads only the session owner's profile and current KST date", async () => {
  const response = await GET();
  expect(mocks.getSajuProfile).toHaveBeenCalledWith(userId);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toMatchObject({
    profile: { birthDate: "1980-04-12" },
    dateKey: "2026-11-14",
  });
});

it("validates and saves a profile for the current user only", async () => {
  const response = await PUT(
    new Request("http://localhost/api/saju-profile", {
      method: "PUT",
      body: JSON.stringify({
        displayName: "아빠",
        birthDate: "1980-04-12",
        calendarType: "lunar",
        isLeapMonth: true,
      }),
    }),
  );
  expect(response.status).toBe(200);
  expect(mocks.saveSajuProfile).toHaveBeenCalledWith(userId, {
    displayName: "아빠",
    birthDate: "1980-04-12",
    calendarType: "lunar",
    isLeapMonth: true,
  });
});

it("rejects invalid profile fields and deletes profile history through the feature use case", async () => {
  const invalid = await PUT(
    new Request("http://localhost/api/saju-profile", {
      method: "PUT",
      body: "{}",
    }),
  );
  expect(invalid.status).toBe(400);
  expect(mocks.saveSajuProfile).not.toHaveBeenCalled();

  const deleted = await DELETE();
  expect(deleted.status).toBe(204);
  expect(mocks.deleteSajuProfile).toHaveBeenCalledWith(userId);
});

it("rejects unauthenticated profile access", async () => {
  mocks.getCurrentUser.mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect((await DELETE()).status).toBe(401);
});
