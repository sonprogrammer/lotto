import { syncLotteryDraws } from "./sync-lottery-draws";
import {
  markLotterySyncFailed,
  markLotterySyncStarted,
  markLotterySyncSucceeded,
} from "./lottery-sync-status";
import { LotteryDrawSyncError } from "./sync-lottery-draws";

export async function runLotteryDrawSync({
  maxAttempts,
}: {
  maxAttempts: number;
}) {
  const runId = crypto.randomUUID();
  await markLotterySyncStarted(runId, new Date());

  try {
    for (let attempt = 1; ; attempt += 1) {
      try {
        const result = await syncLotteryDraws();
        await markLotterySyncSucceeded(runId, new Date(), result.latestRound);
        return result;
      } catch (error) {
        const canRetry =
          error instanceof LotteryDrawSyncError &&
          error.retryable &&
          attempt < maxAttempts;
        if (!canRetry) throw error;
        await delay(attempt * 1_000);
      }
    }
  } catch (error) {
    const safeCode =
      error instanceof LotteryDrawSyncError ? error.code : "invalid_response";
    await markLotterySyncFailed(runId, new Date(), safeCode);
    throw error;
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
