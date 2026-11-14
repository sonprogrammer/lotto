import { ObjectId } from "mongodb";
import { beforeEach, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getSajuProfile: vi.fn(),
    calculateSajuContext: vi.fn(),
    getGroqDailyNumber: vi.fn(),
    claimDailyRecommendation: vi.fn(),
    completeDailyRecommendation: vi.fn(),
    releaseDailyRecommendationClaim: vi.fn(),
  },
}));
vi.mock("@/entities/user/server/saju-profile-store", () => ({
  getSajuProfile: mocks.getSajuProfile,
}));
vi.mock("@/entities/daily-saju/server/daily-saju-store", () => ({
  claimDailyRecommendation: mocks.claimDailyRecommendation,
  completeDailyRecommendation: mocks.completeDailyRecommendation,
  releaseDailyRecommendationClaim: mocks.releaseDailyRecommendationClaim,
}));
vi.mock("./calculate-saju-context", () => ({
  calculateSajuContext: mocks.calculateSajuContext,
}));
vi.mock("./groq-daily-number", () => ({
  getGroqDailyNumber: mocks.getGroqDailyNumber,
}));

import { ensureDailyRecommendation } from "./ensure-daily-recommendation";

const userId = "65ab12cd34ef56ab78cd90ef";
const dateKey = "2026-11-14";
const leaseExpiresAt = new Date("2026-11-14T12:00:30.000Z");
const profile = {
  birthDate: "1980-04-12",
  calendarType: "solar" as const,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};
const context = {
  birthPillars: { year: "임신", month: "경술", day: "계유" },
  today: { dateKey, dayPillar: "병오" },
};
const ready = {
  _id: new ObjectId("65ab12cd34ef56ab78cd9001"),
  userId,
  dateKey,
  status: "ready" as const,
  number: 23,
  explanation: "오늘의 일진을 참고한 숫자입니다.",
  createdAt: new Date("2026-11-14T12:00:00.000Z"),
  updatedAt: new Date("2026-11-14T12:00:01.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSajuProfile.mockResolvedValue(profile);
  mocks.calculateSajuContext.mockReturnValue(context);
  mocks.getGroqDailyNumber.mockResolvedValue({
    number: 23,
    explanation: ready.explanation,
  });
  mocks.claimDailyRecommendation.mockResolvedValue({
    acquired: true,
    leaseExpiresAt,
  });
  mocks.completeDailyRecommendation.mockResolvedValue(ready);
  mocks.releaseDailyRecommendationClaim.mockResolvedValue(undefined);
});

it("returns today's stored recommendation without calling Groq again", async () => {
  mocks.claimDailyRecommendation.mockResolvedValue({
    acquired: false,
    recommendation: ready,
  });
  await expect(ensureDailyRecommendation(userId, dateKey)).resolves.toEqual(
    ready,
  );
  expect(mocks.getGroqDailyNumber).not.toHaveBeenCalled();
});

it("returns the in-progress record when another request owns today's generation", async () => {
  const inProgress = {
    ...ready,
    status: "generating",
    number: undefined,
    explanation: undefined,
    leaseExpiresAt,
  };
  mocks.claimDailyRecommendation.mockResolvedValue({
    acquired: false,
    recommendation: inProgress,
  });
  await expect(ensureDailyRecommendation(userId, dateKey)).resolves.toEqual(
    inProgress,
  );
  expect(mocks.getGroqDailyNumber).not.toHaveBeenCalled();
});

it("uses only the profile-derived saju context and persists the AI result", async () => {
  await expect(ensureDailyRecommendation(userId, dateKey)).resolves.toEqual(
    ready,
  );
  expect(mocks.getSajuProfile).toHaveBeenCalledWith(userId);
  expect(mocks.calculateSajuContext).toHaveBeenCalledWith(profile, dateKey);
  expect(mocks.getGroqDailyNumber).toHaveBeenCalledWith(context);
  expect(mocks.completeDailyRecommendation).toHaveBeenCalledWith(
    userId,
    dateKey,
    leaseExpiresAt,
    {
      number: 23,
      explanation: ready.explanation,
    },
  );
});

it("releases its claim after a provider error so a later request can retry", async () => {
  const error = new Error("provider failed");
  mocks.getGroqDailyNumber.mockRejectedValue(error);
  await expect(ensureDailyRecommendation(userId, dateKey)).rejects.toBe(error);
  expect(mocks.releaseDailyRecommendationClaim).toHaveBeenCalledWith(
    userId,
    dateKey,
    leaseExpiresAt,
  );
});

it("does not claim or call Groq when there is no profile", async () => {
  mocks.getSajuProfile.mockResolvedValue(null);
  await expect(
    ensureDailyRecommendation(userId, dateKey),
  ).rejects.toMatchObject({ name: "SajuProfileRequiredError" });
  expect(mocks.claimDailyRecommendation).not.toHaveBeenCalled();
  expect(mocks.getGroqDailyNumber).not.toHaveBeenCalled();
});
