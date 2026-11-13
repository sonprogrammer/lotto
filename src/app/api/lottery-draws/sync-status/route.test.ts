import { afterEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, getStatusMock, nextSyncMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getStatusMock: vi.fn(),
  nextSyncMock: vi.fn(),
}));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/lottery-draw", () => ({
  getLotterySyncStatus: getStatusMock,
  getNextLotterySyncAt: nextSyncMock,
}));

import { GET } from "./route";

afterEach(() => vi.clearAllMocks());

it("requires a signed-in user", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  const response = await GET();

  expect(response.status).toBe(401);
  expect(getStatusMock).not.toHaveBeenCalled();
});

it("returns shared status dates as ISO strings", async () => {
  getCurrentUserMock.mockResolvedValue({ userId: "user-1" });
  getStatusMock.mockResolvedValue({
    lastAttemptAt: new Date("2026-11-14T12:00:00.000Z"),
    lastSuccessAt: new Date("2026-11-07T12:00:00.000Z"),
    state: "success",
    latestRound: 1249,
    errorSummary: null,
  });
  nextSyncMock.mockReturnValue(new Date("2026-11-21T12:00:00.000Z"));

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    lastAttemptAt: "2026-11-14T12:00:00.000Z",
    lastSuccessAt: "2026-11-07T12:00:00.000Z",
    state: "success",
    latestRound: 1249,
    errorSummary: null,
    nextExpectedAt: "2026-11-21T12:00:00.000Z",
  });
});
