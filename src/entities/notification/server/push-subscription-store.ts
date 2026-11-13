import { ObjectId } from "mongodb";
import { getMongoDb } from "@/shared/server/mongodb/client";
import type { PushSubscriptionDocument } from "../model/document";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string | null;
};

function collection() {
  return getMongoDb().then((db) =>
    db.collection<PushSubscriptionDocument>("push_subscriptions"),
  );
}

export async function upsertPushSubscription(
  userId: string,
  subscription: PushSubscriptionInput,
): Promise<void> {
  const subscriptions = await collection();
  await subscriptions.createIndex({ endpoint: 1 }, { unique: true });
  const now = new Date();
  await subscriptions.updateOne(
    { endpoint: subscription.endpoint },
    {
      $set: {
        userId,
        keys: subscription.keys,
        userAgent: subscription.userAgent ?? null,
        lastUsedAt: now,
        updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now },
    },
    { upsert: true },
  );
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string,
): Promise<boolean> {
  const result = await (await collection()).deleteOne({ userId, endpoint });
  return result.deletedCount > 0;
}
