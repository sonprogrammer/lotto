import { afterEach, expect, it, vi } from "vitest";

const {
  syncLotteryDrawsMock,
  markStartedMock,
  markSucceededMock,
  markFailedMock,
} = vi.hoisted(() => ({
  syncLotteryDrawsMock: vi.fn(),
  markStartedMock: vi.fn(),
  markSucceededMock: vi.fn(),
  markFailedMock: vi.fn(),
}));

vi.mock("./sync-lottery-draws", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sync-lottery-draws")>();
  return { ...actual, syncLotteryDraws: syncLotteryDrawsMock };
});

vi.mock("./lottery-sync-status", () => ({
  markLotterySyncStarted: markStartedMock,
  markLotterySyncSucceeded: markSucceededMock,
  markLotterySyncFailed: markFailedMock,
}));

import { LotteryDrawSyncError } from "./sync-lottery-draws";
import { runLotteryDrawSync } from "./run-lottery-draw-sync";

const syncResult = {
  drawCount: 1249,
  latestRound: 1249,
  latestDrawVersion: "draw-version",
  changed: true,
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("retries a transient source error and records the successful round", async () => {
  vi.useFakeTimers();
  syncLotteryDrawsMock
    .mockRejectedValueOnce(new LotteryDrawSyncError("source_unavailable", true))
    .mockResolvedValueOnce(syncResult);

  const resultPromise = runLotteryDrawSync({ maxAttempts: 3 });
  await vi.advanceTimersByTimeAsync(1000);

  await expect(resultPromise).resolves.toEqual(syncResult);
  expect(syncLotteryDrawsMock).toHaveBeenCalledTimes(2);
  expect(markStartedMock).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(Date),
  );
  expect(markSucceededMock).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(Date),
    1249,
  );
  expect(markFailedMock).not.toHaveBeenCalled();
});

it("does not retry invalid provider data and records the failure", async () => {
  const invalidResponse = new LotteryDrawSyncError("invalid_response", false);
  syncLotteryDrawsMock.mockRejectedValue(invalidResponse);

  await expect(runLotteryDrawSync({ maxAttempts: 3 })).rejects.toBe(
    invalidResponse,
  );

  expect(syncLotteryDrawsMock).toHaveBeenCalledOnce();
  expect(markFailedMock).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(Date),
    "invalid_response",
  );
  expect(markSucceededMock).not.toHaveBeenCalled();
});

it("stops after the configured retry count and stores a safe failure code", async () => {
  vi.useFakeTimers();
  const unavailable = new LotteryDrawSyncError("source_unavailable", true);
  syncLotteryDrawsMock.mockRejectedValue(unavailable);

  const resultPromise = runLotteryDrawSync({ maxAttempts: 3 });
  const rejectionAssertion = expect(resultPromise).rejects.toBe(unavailable);
  await vi.advanceTimersByTimeAsync(3_000);
  await rejectionAssertion;

  expect(syncLotteryDrawsMock).toHaveBeenCalledTimes(3);
  expect(markFailedMock).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(Date),
    "source_unavailable",
  );
  expect(markSucceededMock).not.toHaveBeenCalled();
});
