import * as webpush from "web-push";
import { getMongoDb } from "@/shared/server/mongodb/client";
import type {
  NotificationDocument,
  PushDeliveryDocument,
  PushSubscriptionDocument,
} from "../model/document";
import { getVapidConfig } from "./vapid-config";

export async function sendPendingPushDeliveries() {
  const config = getVapidConfig();
  if (!config) return { sentCount: 0, failedCount: 0 };
  try {
    webpush.setVapidDetails(
      config.subject,
      config.publicKey,
      config.privateKey,
    );
  } catch {
    console.error("Web Push VAPID configuration is invalid.");
    return { sentCount: 0, failedCount: 0 };
  }
  const db = await getMongoDb();
  const deliveries = db.collection<PushDeliveryDocument>("push_deliveries");
  const subscriptions =
    db.collection<PushSubscriptionDocument>("push_subscriptions");
  const notifications = db.collection<NotificationDocument>("notifications");
  let sentCount = 0;
  let failedCount = 0;
  for (;;) {
    const delivery = await deliveries.findOneAndUpdate(
      { status: "pending" },
      {
        $set: {
          status: "attempted",
          attemptedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    if (!delivery) break;
    const [subscription, notification] = await Promise.all([
      subscriptions.findOne({
        _id: delivery.subscriptionId,
        userId: delivery.userId,
      }),
      notifications.findOne({
        _id: delivery.notificationId,
        userId: delivery.userId,
      }),
    ]);
    try {
      if (!subscription || !notification || notification.status !== "won")
        throw new Error("missing_or_corrected_target");
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        JSON.stringify({
          title: "로또 알림",
          body: "저장한 번호의 당첨 결과가 있어요.",
          url: "/notifications",
        }),
      );
      await deliveries.updateOne(
        { _id: delivery._id, userId: delivery.userId, status: "attempted" },
        { $set: { status: "sent", sentAt: new Date(), updatedAt: new Date() } },
      );
      sentCount += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? Number(error.statusCode)
          : 0;
      if (statusCode === 404 || statusCode === 410)
        await subscriptions.deleteOne({
          _id: delivery.subscriptionId,
          userId: delivery.userId,
        });
      await deliveries.updateOne(
        { _id: delivery._id, userId: delivery.userId, status: "attempted" },
        {
          $set: {
            status: "failed",
            failureCode: statusCode ? `http_${statusCode}` : "send_failed",
            updatedAt: new Date(),
          },
        },
      );
      failedCount += 1;
    }
  }
  return { sentCount, failedCount };
}
