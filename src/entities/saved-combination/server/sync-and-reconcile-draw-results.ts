import { runLotteryDrawSync } from "@/entities/lottery-draw";
import { reconcileSavedCombinationDrawResults } from "./reconcile-draw-results";
import { reconcileDrawNotifications } from "@/entities/notification/server/reconcile-draw-notifications";
import { sendPendingPushDeliveries } from "@/entities/notification/server/send-pending-push-deliveries";

export async function syncAndReconcileSavedCombinationDrawResults({
  maxAttempts,
}: {
  maxAttempts: number;
}) {
  const syncResult = await runLotteryDrawSync({ maxAttempts });
  await reconcileSavedCombinationDrawResults({
    historyChanged: syncResult.changed,
  });
  try {
    await reconcileDrawNotifications({ latestRound: syncResult.latestRound });
    await sendPendingPushDeliveries();
  } catch {
    // Notification delivery is additive and must not block result lookup or analysis.
    console.error("Notification reconciliation or delivery failed.");
  }
  return syncResult;
}
