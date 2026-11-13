import { beforeEach, describe, expect, it, vi } from "vitest";

const { runLotteryDrawSyncMock, reconcileMock } = vi.hoisted(() => ({
  runLotteryDrawSyncMock: vi.fn(),
  reconcileMock: vi.fn(),
}));

vi.mock("@/entities/lottery-draw", () => ({
  runLotteryDrawSync: runLotteryDrawSyncMock,
}));
vi.mock("./reconcile-draw-results", () => ({
  reconcileSavedCombinationDrawResults: reconcileMock,
}));

import { syncAndReconcileSavedCombinationDrawResults } from "./sync-and-reconcile-draw-results";

const syncResult = {
  drawCount: 100,
  latestRound: 100,
  latestDrawVersion: "version",
  changed: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  runLotteryDrawSyncMock.mockResolvedValue(syncResult);
  reconcileMock.mockResolvedValue({ updatedCount: 2 });
});

describe("syncAndReconcileSavedCombinationDrawResults", () => {
  it("reconciles after sync and returns the sync result", async () => {
    await expect(
      syncAndReconcileSavedCombinationDrawResults({ maxAttempts: 3 }),
    ).resolves.toEqual(syncResult);

    expect(runLotteryDrawSyncMock).toHaveBeenCalledWith({ maxAttempts: 3 });
    expect(reconcileMock).toHaveBeenCalledWith({ historyChanged: true });
  });

  it("skips reconciliation when sync fails", async () => {
    runLotteryDrawSyncMock.mockRejectedValue(new Error("sync failed"));

    await expect(
      syncAndReconcileSavedCombinationDrawResults({ maxAttempts: 1 }),
    ).rejects.toThrow("sync failed");
    expect(reconcileMock).not.toHaveBeenCalled();
  });
});
