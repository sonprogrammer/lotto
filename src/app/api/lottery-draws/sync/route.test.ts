import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, syncDrawsMock, revalidateTagMock } = vi.hoisted(
  () => ({
    getCurrentUserMock: vi.fn(),
    syncDrawsMock: vi.fn(),
    revalidateTagMock: vi.fn(),
  }),
);

vi.mock("next/cache", () => ({ revalidateTag: revalidateTagMock }));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/lottery-draw", () => ({
  LOTTERY_DRAW_HISTORY_CACHE_TAG: "lottery-draw-history",
}));
vi.mock("@/entities/saved-combination", () => ({
  syncAndReconcileSavedCombinationDrawResults: syncDrawsMock,
}));
vi.mock("@/features/analysis", () => ({
  WEEKLY_ANALYSIS_CACHE_TAG: "weekly-analysis",
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue({ userId: "user-1" });
  syncDrawsMock.mockResolvedValue({ changed: false, latestRound: 1249 });
});

it("rejects signed-out requests before synchronizing", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  const response = await POST();

  expect(response.status).toBe(401);
  expect(syncDrawsMock).not.toHaveBeenCalled();
});

it("synchronizes and invalidates shared data when the result changes", async () => {
  syncDrawsMock.mockResolvedValue({ changed: true, latestRound: 1250 });

  const response = await POST();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ changed: true, latestRound: 1250 });
  expect(syncDrawsMock).toHaveBeenCalledWith({ maxAttempts: 1 });
  expect(revalidateTagMock).toHaveBeenCalledWith("weekly-analysis", {
    expire: 0,
  });
  expect(revalidateTagMock).toHaveBeenCalledWith("lottery-draw-history", {
    expire: 0,
  });
});

it("does not invalidate draw data when the provider has no changes", async () => {
  const response = await POST();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ changed: false, latestRound: 1249 });
  expect(revalidateTagMock).not.toHaveBeenCalled();
});

it("returns a retryable message when synchronization fails", async () => {
  syncDrawsMock.mockRejectedValue(new Error("source details"));

  const response = await POST();

  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({
    error: "당첨 번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
  });
});
