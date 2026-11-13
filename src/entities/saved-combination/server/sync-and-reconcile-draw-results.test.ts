import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  runLotteryDrawSyncMock,
  reconcileMock,
  reconcileNotificationsMock,
  sendPushMock,
} = vi.hoisted(() => ({
  runLotteryDrawSyncMock: vi.fn(),
  reconcileMock: vi.fn(),
  reconcileNotificationsMock: vi.fn(),
  sendPushMock: vi.fn(),
}));

vi.mock("@/entities/lottery-draw", () => ({
  runLotteryDrawSync: runLotteryDrawSyncMock,
}));
vi.mock("./reconcile-draw-results", () => ({
  reconcileSavedCombinationDrawResults: reconcileMock,
}));
vi.mock("@/entities/notification/server/reconcile-draw-notifications", () => ({
  reconcileDrawNotifications: reconcileNotificationsMock,
}));
vi.mock("@/entities/notification/server/send-pending-push-deliveries", () => ({
  sendPendingPushDeliveries: sendPushMock,
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
  reconcileNotificationsMock.mockResolvedValue({
    createdCount: 1,
    updatedCount: 0,
  });
  sendPushMock.mockResolvedValue({ sentCount: 1, failedCount: 0 });
});

describe("syncAndReconcileSavedCombinationDrawResults", () => {
  it("reconciles after sync and returns the sync result", async () => {
    await expect(
      syncAndReconcileSavedCombinationDrawResults({ maxAttempts: 3 }),
    ).resolves.toEqual(syncResult);

    expect(runLotteryDrawSyncMock).toHaveBeenCalledWith({ maxAttempts: 3 });
    expect(reconcileMock).toHaveBeenCalledWith({ historyChanged: true });
    expect(reconcileNotificationsMock).toHaveBeenCalledWith({
      latestRound: 100,
    });
    expect(sendPushMock).toHaveBeenCalledOnce();
  });

  it("skips reconciliation when sync fails", async () => {
    runLotteryDrawSyncMock.mockRejectedValue(new Error("sync failed"));

    await expect(
      syncAndReconcileSavedCombinationDrawResults({ maxAttempts: 1 }),
    ).rejects.toThrow("sync failed");
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it("does not block the result sync when notification processing fails", async () => {
    reconcileNotificationsMock.mockRejectedValue(
      new Error("notifications unavailable"),
    );
    await expect(
      syncAndReconcileSavedCombinationDrawResults({ maxAttempts: 1 }),
    ).resolves.toEqual(syncResult);
  });
});
