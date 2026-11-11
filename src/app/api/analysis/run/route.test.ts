import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, syncLotteryDrawsMock, listLotteryDrawsMock } =
  vi.hoisted(() => ({
    getCurrentUserMock: vi.fn(),
    syncLotteryDrawsMock: vi.fn(),
    listLotteryDrawsMock: vi.fn(),
  }));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/lottery-draw", () => ({
  syncLotteryDraws: syncLotteryDrawsMock,
  listLotteryDraws: listLotteryDrawsMock,
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue({ userId: "user-1", nickname: "진" });
  syncLotteryDrawsMock.mockResolvedValue({ drawCount: 1, latestRound: 1249 });
  listLotteryDrawsMock.mockResolvedValue([
    { roundNumber: 1249, numbers: [2, 11, 16, 25, 34, 35] },
  ]);
});

it("syncs real draw data before calculating the analysis", async () => {
  const response = await POST();
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(syncLotteryDrawsMock).toHaveBeenCalledOnce();
  expect(listLotteryDrawsMock).toHaveBeenCalledOnce();
  expect(body.latestRound).toBe(1249);
  expect(body.analysis.drawCount).toBe(1);
});

it("requires an authenticated user", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  const response = await POST();

  expect(response.status).toBe(401);
  expect(syncLotteryDrawsMock).not.toHaveBeenCalled();
});

it("returns a recoverable error if synchronization fails", async () => {
  syncLotteryDrawsMock.mockRejectedValue(new Error("provider unavailable"));

  const response = await POST();

  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({
    error: "분석 자료를 가져오지 못했어요.",
  });
  expect(listLotteryDrawsMock).not.toHaveBeenCalled();
});
