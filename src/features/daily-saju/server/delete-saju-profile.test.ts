import { beforeEach, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => ({
  mocks: { removeSajuProfile: vi.fn(), deleteDailyRecommendations: vi.fn() },
}));
vi.mock("@/entities/user/server/saju-profile-store", () => ({
  removeSajuProfile: mocks.removeSajuProfile,
}));
vi.mock("@/entities/daily-saju/server/daily-saju-store", () => ({
  deleteDailyRecommendations: mocks.deleteDailyRecommendations,
}));

import { deleteSajuProfile } from "./delete-saju-profile";

const userId = "65ab12cd34ef56ab78cd90ef";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.removeSajuProfile.mockResolvedValue(true);
  mocks.deleteDailyRecommendations.mockResolvedValue(undefined);
});

it("removes the user's profile and all their daily saju history", async () => {
  await deleteSajuProfile(userId);
  expect(mocks.removeSajuProfile).toHaveBeenCalledWith(userId);
  expect(mocks.deleteDailyRecommendations).toHaveBeenCalledWith(userId);
});

it("does not delete recommendation history if the user record is missing", async () => {
  mocks.removeSajuProfile.mockResolvedValue(false);
  await expect(deleteSajuProfile(userId)).rejects.toMatchObject({
    name: "SajuProfileNotFoundError",
  });
  expect(mocks.deleteDailyRecommendations).not.toHaveBeenCalled();
});
