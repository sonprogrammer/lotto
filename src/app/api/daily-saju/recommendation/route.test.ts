import { ObjectId } from "mongodb";
import { beforeEach, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getCurrentUser: vi.fn(),
    getKstDateKey: vi.fn(),
    ensureDailyRecommendation: vi.fn(),
  },
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/features/daily-saju/lib/get-kst-date-key", () => ({
  getKstDateKey: mocks.getKstDateKey,
}));
vi.mock("@/features/daily-saju/server/ensure-daily-recommendation", () => ({
  ensureDailyRecommendation: mocks.ensureDailyRecommendation,
  SajuProfileRequiredError: class SajuProfileRequiredError extends Error {
    name = "SajuProfileRequiredError";
  },
}));
vi.mock("@/features/daily-saju/server/groq-daily-number", () => ({
  GroqDailyNumberError: class GroqDailyNumberError extends Error {
    constructor(
      public kind: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

import { POST } from "./route";
import { SajuProfileRequiredError } from "@/features/daily-saju/server/ensure-daily-recommendation";
import { GroqDailyNumberError } from "@/features/daily-saju/server/groq-daily-number";

const userId = "65ab12cd34ef56ab78cd90ef";
const ready = {
  _id: new ObjectId("65ab12cd34ef56ab78cd9001"),
  userId,
  dateKey: "2026-11-14",
  status: "ready",
  number: 23,
  explanation: "오늘의 일진을 참고한 숫자입니다.",
  createdAt: new Date("2026-11-14T12:00:00.000Z"),
  updatedAt: new Date("2026-11-14T12:00:01.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ userId });
  mocks.getKstDateKey.mockReturnValue("2026-11-14");
  mocks.ensureDailyRecommendation.mockResolvedValue(ready);
});

it("requires a session before generating a recommendation", async () => {
  mocks.getCurrentUser.mockResolvedValue(null);
  const response = await POST();
  expect(response.status).toBe(401);
  expect(mocks.ensureDailyRecommendation).not.toHaveBeenCalled();
});

it("uses server session and KST date and responds as private no-store data", async () => {
  const response = await POST();
  expect(mocks.getKstDateKey).toHaveBeenCalledWith(expect.any(Date));
  expect(mocks.ensureDailyRecommendation).toHaveBeenCalledWith(
    userId,
    "2026-11-14",
  );
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toMatchObject({
    status: "ready",
    dateKey: "2026-11-14",
    number: 23,
  });
});

it("maps missing profile to a profile-required state and provider failures to retryable errors", async () => {
  mocks.ensureDailyRecommendation.mockRejectedValueOnce(
    new SajuProfileRequiredError(),
  );
  const missing = await POST();
  expect(missing.status).toBe(409);
  await expect(missing.json()).resolves.toMatchObject({
    state: "profile-required",
  });

  mocks.ensureDailyRecommendation.mockRejectedValueOnce(
    new GroqDailyNumberError("rate-limit", "failed"),
  );
  const failed = await POST();
  expect(failed.status).toBe(503);
  await expect(failed.json()).resolves.toMatchObject({ retryable: true });
});
