import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { getMongoDb } from "@/shared/server/mongodb/client";
import {
  LOTTERY_SYNC_STATUS_DOCUMENT_ID,
  LotterySyncStatusSchema,
  type LotterySyncStatus,
  type LotterySyncStatusDocument,
} from "../model/sync-status";

export const LOTTERY_SYNC_STATUS_CACHE_TAG = "lottery-sync-status";

export async function getLotterySyncStatus(): Promise<LotterySyncStatus> {
  return getCachedLotterySyncStatus();
}

export async function markLotterySyncStarted(
  runId: string,
  attemptedAt: Date,
): Promise<void> {
  const collection = (await getMongoDb()).collection<LotterySyncStatusDocument>(
    "lottery_sync_status",
  );
  await collection.updateOne(
    { _id: LOTTERY_SYNC_STATUS_DOCUMENT_ID },
    {
      $set: {
        runId,
        lastAttemptAt: attemptedAt,
        state: "running",
        errorSummary: null,
      },
      $setOnInsert: { lastSuccessAt: null, latestRound: null },
    },
    { upsert: true },
  );
  revalidateTag(LOTTERY_SYNC_STATUS_CACHE_TAG, { expire: 0 });
}

export async function markLotterySyncSucceeded(
  runId: string,
  completedAt: Date,
  latestRound: number,
): Promise<void> {
  const collection = (await getMongoDb()).collection<LotterySyncStatusDocument>(
    "lottery_sync_status",
  );
  await collection.updateOne(
    { _id: LOTTERY_SYNC_STATUS_DOCUMENT_ID, runId },
    {
      $set: {
        lastSuccessAt: completedAt,
        latestRound,
        state: "success",
        errorSummary: null,
      },
    },
  );
  revalidateTag(LOTTERY_SYNC_STATUS_CACHE_TAG, { expire: 0 });
}

export async function markLotterySyncFailed(
  runId: string,
  _failedAt: Date,
  errorSummary: string,
): Promise<void> {
  const collection = (await getMongoDb()).collection<LotterySyncStatusDocument>(
    "lottery_sync_status",
  );
  await collection.updateOne(
    { _id: LOTTERY_SYNC_STATUS_DOCUMENT_ID, runId },
    { $set: { state: "failed", errorSummary: errorSummary.slice(0, 100) } },
  );
  revalidateTag(LOTTERY_SYNC_STATUS_CACHE_TAG, { expire: 0 });
}

async function getCachedLotterySyncStatus(): Promise<LotterySyncStatus> {
  "use cache";

  cacheLife("minutes");
  cacheTag(LOTTERY_SYNC_STATUS_CACHE_TAG);

  const document = await (
    await getMongoDb()
  )
    .collection<LotterySyncStatusDocument>("lottery_sync_status")
    .findOne({ _id: LOTTERY_SYNC_STATUS_DOCUMENT_ID });

  if (!document) {
    return {
      lastAttemptAt: null,
      lastSuccessAt: null,
      state: "idle",
      latestRound: null,
      errorSummary: null,
    };
  }

  return LotterySyncStatusSchema.parse(document);
}
