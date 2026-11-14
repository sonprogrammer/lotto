import { ObjectId } from "mongodb";
import { getMongoDb } from "@/shared/server/mongodb/client";
import type { DailySajuRecommendationDocument } from "../model/document";

const CLAIM_LEASE_MS = 30_000;

function getCollection() {
  return getMongoDb().then((database) =>
    database.collection<DailySajuRecommendationDocument>(
      "daily_saju_recommendations",
    ),
  );
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export type DailyRecommendationClaim =
  | { acquired: true; leaseExpiresAt: Date }
  | { acquired: false; recommendation: DailySajuRecommendationDocument };

export async function getDailyRecommendation(
  userId: string,
  dateKey: string,
): Promise<DailySajuRecommendationDocument | null> {
  return (await getCollection()).findOne({ userId, dateKey });
}

export async function claimDailyRecommendation(
  userId: string,
  dateKey: string,
  now = new Date(),
): Promise<DailyRecommendationClaim> {
  const recommendations = await getCollection();
  await recommendations.createIndex(
    { userId: 1, dateKey: 1 },
    { unique: true },
  );
  const leaseExpiresAt = new Date(now.getTime() + CLAIM_LEASE_MS);
  try {
    await recommendations.insertOne({
      _id: new ObjectId(),
      userId,
      dateKey,
      status: "generating",
      leaseExpiresAt,
      createdAt: now,
      updatedAt: now,
    });
    return { acquired: true, leaseExpiresAt };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }

  const existing = await recommendations.findOne({ userId, dateKey });
  if (!existing) throw new Error("Daily recommendation claim disappeared");
  if (existing.status === "ready") {
    return { acquired: false, recommendation: existing };
  }
  if (existing.leaseExpiresAt && existing.leaseExpiresAt > now) {
    return { acquired: false, recommendation: existing };
  }

  const takeover = await recommendations.updateOne(
    {
      userId,
      dateKey,
      status: "generating",
      leaseExpiresAt: { $lte: now },
    },
    { $set: { leaseExpiresAt, updatedAt: now } },
  );
  if (takeover.modifiedCount === 1) return { acquired: true, leaseExpiresAt };

  const current = await recommendations.findOne({ userId, dateKey });
  if (!current) throw new Error("Daily recommendation claim disappeared");
  return { acquired: false, recommendation: current };
}

export async function completeDailyRecommendation(
  userId: string,
  dateKey: string,
  leaseExpiresAt: Date,
  result: { number: number; explanation: string },
): Promise<DailySajuRecommendationDocument | null> {
  const recommendations = await getCollection();
  const update = await recommendations.updateOne(
    { userId, dateKey, status: "generating", leaseExpiresAt },
    {
      $set: { status: "ready", ...result, updatedAt: new Date() },
      $unset: { leaseExpiresAt: "" },
    },
  );
  if (update.modifiedCount !== 1) return null;
  return recommendations.findOne({ userId, dateKey });
}

export async function releaseDailyRecommendationClaim(
  userId: string,
  dateKey: string,
  leaseExpiresAt: Date,
): Promise<void> {
  await (
    await getCollection()
  ).deleteOne({
    userId,
    dateKey,
    status: "generating",
    leaseExpiresAt,
  });
}

export async function deleteDailyRecommendations(
  userId: string,
): Promise<void> {
  await (await getCollection()).deleteMany({ userId });
}
