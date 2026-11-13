import { ObjectId } from "mongodb";
import { getMongoDb } from "@/shared/server/mongodb/client";
import type { SavedCombinationDocument } from "@/entities/saved-combination/model/document";
import type {
  NotificationDocument,
  PushSubscriptionDocument,
  PushDeliveryDocument,
} from "../model/document";

export async function reconcileDrawNotifications({
  latestRound,
}: {
  latestRound: number;
}) {
  const db = await getMongoDb();
  const draws = db.collection("lottery_draws");
  const combinations =
    db.collection<SavedCombinationDocument>("saved_combinations");
  const notifications = db.collection<NotificationDocument>("notifications");
  const subscriptions =
    db.collection<PushSubscriptionDocument>("push_subscriptions");
  const deliveries = db.collection<PushDeliveryDocument>("push_deliveries");
  await notifications.createIndex(
    { userId: 1, savedCombinationId: 1, roundNumber: 1 },
    { unique: true },
  );
  await deliveries.createIndex(
    { notificationId: 1, subscriptionId: 1 },
    { unique: true },
  );
  const latest = await draws.findOne({ roundNumber: latestRound });
  if (!latest) return { createdCount: 0, updatedCount: 0 };
  const comboRows = await combinations
    .find({ "drawResults.roundNumber": latestRound })
    .toArray();
  let createdCount = 0;
  let updatedCount = 0;
  for (const combination of comboRows) {
    const result = combination.drawResults.find(
      (item) => item.roundNumber === latestRound,
    );
    if (!result) continue;
    const id = new ObjectId();
    const values =
      result.rank === null
        ? { status: "corrected" as const, rank: null, amountPerWinner: 0 }
        : {
            status: "won" as const,
            rank: result.rank,
            amountPerWinner: result.amountPerWinner,
          };
    const existing = await notifications.findOne({
      userId: combination.userId,
      savedCombinationId: combination._id,
      roundNumber: latestRound,
    });
    if (result.rank === null && !existing) continue;
    const now = new Date();
    const write = await notifications.updateOne(
      {
        userId: combination.userId,
        savedCombinationId: combination._id,
        roundNumber: latestRound,
      },
      {
        $set: { ...values, drawDate: result.drawDate, updatedAt: now },
        $setOnInsert: {
          _id: id,
          userId: combination.userId,
          savedCombinationId: combination._id,
          roundNumber: latestRound,
          readAt: null,
          createdAt: now,
        },
      },
      { upsert: values.status === "won" },
    );
    if (write.upsertedCount) {
      createdCount += 1;
    } else if (write.matchedCount) updatedCount += 1;
    const notification = await notifications.findOne({
      userId: combination.userId,
      savedCombinationId: combination._id,
      roundNumber: latestRound,
    });
    if (!notification || notification.status !== "won") continue;
    const active = await subscriptions
      .find({
        userId: combination.userId,
        createdAt: { $lte: notification.createdAt },
      })
      .toArray();
    for (const subscription of active) {
      await deliveries.updateOne(
        { notificationId: notification._id, subscriptionId: subscription._id },
        {
          $setOnInsert: {
            _id: new ObjectId(),
            userId: combination.userId,
            notificationId: notification._id,
            subscriptionId: subscription._id,
            status: "pending",
            attemptedAt: null,
            sentAt: null,
            failureCode: null,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );
    }
  }
  return { createdCount, updatedCount };
}
