import { runLotteryDrawSync } from "@/entities/lottery-draw";
import { reconcileSavedCombinationDrawResults } from "./reconcile-draw-results";

export async function syncAndReconcileSavedCombinationDrawResults({
  maxAttempts,
}: {
  maxAttempts: number;
}) {
  const syncResult = await runLotteryDrawSync({ maxAttempts });
  await reconcileSavedCombinationDrawResults({
    historyChanged: syncResult.changed,
  });
  return syncResult;
}
