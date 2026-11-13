import { ObjectId } from "mongodb";
import { getMongoDb } from "@/shared/server/mongodb/client";
import type { Notification, NotificationPage } from "../model/notification";
import type { NotificationDocument } from "../model/document";

function collection() {
  return getMongoDb().then((db) =>
    db.collection<NotificationDocument>("notifications"),
  );
}

function serialize(doc: NotificationDocument): Notification {
  return {
    id: doc._id.toHexString(),
    savedCombinationId: doc.savedCombinationId.toHexString(),
    roundNumber: doc.roundNumber,
    drawDate: doc.drawDate.toISOString(),
    status: doc.status,
    rank: doc.rank,
    amountPerWinner: doc.amountPerWinner,
    readAt: doc.readAt?.toISOString() ?? null,
  };
}

export async function listNotifications(
  userId: string,
  page: number,
  pageSize: number,
): Promise<NotificationPage> {
  const notifications = await collection();
  await notifications.createIndex({ userId: 1, createdAt: -1, _id: -1 });
  await notifications.createIndex(
    { userId: 1, savedCombinationId: 1, roundNumber: 1 },
    { unique: true },
  );
  const total = await notifications.countDocuments({ userId });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const resolvedPage = Math.min(Math.max(1, page), totalPages);
  const items = await notifications
    .find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .skip((resolvedPage - 1) * pageSize)
    .limit(pageSize)
    .toArray();
  return {
    items: items.map(serialize),
    page: resolvedPage,
    pageSize,
    total,
    totalPages,
  };
}

export async function countUnreadNotifications(
  userId: string,
): Promise<number> {
  return (await collection()).countDocuments({ userId, readAt: null });
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<Notification | null> {
  if (!ObjectId.isValid(id)) return null;
  const document = await (
    await collection()
  ).findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    [
      {
        $set: { readAt: { $ifNull: ["$readAt", "$$NOW"] }, updatedAt: "$$NOW" },
      },
    ],
    { returnDocument: "after" },
  );
  return document ? serialize(document) : null;
}
