import { afterEach, expect, it, vi } from "vitest";

const { runSyncMock, revalidateTagMock } = vi.hoisted(() => ({
  runSyncMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: revalidateTagMock }));
vi.mock("@/entities/lottery-draw", () => ({
  LOTTERY_DRAW_HISTORY_CACHE_TAG: "lottery-draw-history",
}));
vi.mock("@/entities/saved-combination", () => ({
  syncAndReconcileSavedCombinationDrawResults: runSyncMock,
}));
vi.mock("@/features/analysis", () => ({
  WEEKLY_ANALYSIS_CACHE_TAG: "weekly-analysis",
}));

import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("rejects a request without the configured cron secret", async () => {
  vi.stubEnv("CRON_SECRET", "secret");

  const response = await GET(new Request("https://example.test/api/cron"));

  expect(response.status).toBe(401);
  expect(runSyncMock).not.toHaveBeenCalled();
});

it("rejects a mismatched cron secret", async () => {
  vi.stubEnv("CRON_SECRET", "secret");

  const response = await GET(
    new Request("https://example.test/api/cron", {
      headers: { authorization: "Bearer wrong" },
    }),
  );

  expect(response.status).toBe(401);
  expect(runSyncMock).not.toHaveBeenCalled();
});

it("runs retries and invalidates shared data caches when history changes", async () => {
  vi.stubEnv("CRON_SECRET", "secret");
  runSyncMock.mockResolvedValue({ changed: true, latestRound: 1249 });

  const response = await GET(
    new Request("https://example.test/api/cron", {
      headers: { authorization: "Bearer secret" },
    }),
  );

  expect(response.status).toBe(200);
  expect(runSyncMock).toHaveBeenCalledWith({ maxAttempts: 3 });
  expect(revalidateTagMock).toHaveBeenCalledWith("weekly-analysis", {
    expire: 0,
  });
  expect(revalidateTagMock).toHaveBeenCalledWith("lottery-draw-history", {
    expire: 0,
  });
});
it("does not invalidate draw caches when the provider result is unchanged", async () => {
  vi.stubEnv("CRON_SECRET", "secret");
  runSyncMock.mockResolvedValue({ changed: false, latestRound: 1249 });

  const response = await GET(
    new Request("https://example.test/api/cron", {
      headers: { authorization: "Bearer secret" },
    }),
  );

  expect(response.status).toBe(200);
  expect(revalidateTagMock).not.toHaveBeenCalled();
});
