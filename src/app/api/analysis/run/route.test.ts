import { beforeEach, expect, it, vi } from "vitest";

const {
  getCurrentUserMock,
  syncLotteryDrawsMock,
  getCachedWeeklyAnalysisMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  syncLotteryDrawsMock: vi.fn(),
  getCachedWeeklyAnalysisMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: revalidateTagMock }));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/lottery-draw", () => ({
  LOTTERY_DRAW_HISTORY_CACHE_TAG: "lottery-draw-history",
}));
vi.mock("@/entities/saved-combination", () => ({
  syncAndReconcileSavedCombinationDrawResults: syncLotteryDrawsMock,
}));
vi.mock("@/features/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/analysis")>()),
  getCachedWeeklyAnalysis: getCachedWeeklyAnalysisMock,
}));

import { POST } from "./route";

const periodSummary = {
  type: "recent",
  count: 30,
  drawCount: 1,
  firstRound: 1249,
  latestRound: 1249,
};

function createRequest(body: unknown) {
  return new Request("http://localhost/api/analysis/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue({ userId: "user-1" });
  syncLotteryDrawsMock.mockResolvedValue({
    drawCount: 1249,
    latestRound: 1249,
    latestDrawVersion: "version-1",
    changed: false,
  });
  getCachedWeeklyAnalysisMock.mockResolvedValue({
    analysis: { latestRound: 1249 },
    period: periodSummary,
    availableDrawCount: 1249,
  });
});

it("calculates the requested period using the latest shared source version", async () => {
  const response = await POST(
    createRequest({ period: { type: "recent", count: 10 } }),
  );
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(syncLotteryDrawsMock).toHaveBeenCalledOnce();
  expect(getCachedWeeklyAnalysisMock).toHaveBeenCalledWith(1249, "version-1", {
    type: "recent",
    count: 10,
  });
  expect(body.period).toEqual(periodSummary);
  expect(body.availableDrawCount).toBe(1249);
  expect(revalidateTagMock).not.toHaveBeenCalled();
});

it("expires shared analysis and history caches after a draw sync changes data", async () => {
  syncLotteryDrawsMock.mockResolvedValue({
    drawCount: 1250,
    latestRound: 1250,
    latestDrawVersion: "version-2",
    changed: true,
  });

  await POST(createRequest({ period: { type: "all" } }));

  expect(revalidateTagMock).toHaveBeenCalledWith("weekly-analysis", {
    expire: 0,
  });
  expect(revalidateTagMock).toHaveBeenCalledWith("lottery-draw-history", {
    expire: 0,
  });
});

it("rejects invalid periods before synchronizing data", async () => {
  const response = await POST(
    createRequest({ period: { type: "recent", count: 0 } }),
  );

  expect(response.status).toBe(400);
  expect(syncLotteryDrawsMock).not.toHaveBeenCalled();
});

it("rejects a requested period longer than available history", async () => {
  syncLotteryDrawsMock.mockResolvedValue({
    drawCount: 12,
    latestRound: 12,
    latestDrawVersion: "version-1",
    changed: false,
  });

  const response = await POST(
    createRequest({ period: { type: "recent", count: 30 } }),
  );

  expect(response.status).toBe(400);
  expect(getCachedWeeklyAnalysisMock).not.toHaveBeenCalled();
});

it("requires an authenticated user", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  const response = await POST(createRequest({ period: { type: "all" } }));

  expect(response.status).toBe(401);
  expect(syncLotteryDrawsMock).not.toHaveBeenCalled();
});
