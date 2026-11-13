import { beforeEach, expect, it, vi } from "vitest";

const {
  documents,
  findOneMock,
  updateOneMock,
  cacheLifeMock,
  cacheTagMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  documents: new Map<string, Record<string, unknown>>(),
  findOneMock: vi.fn(),
  updateOneMock: vi.fn(),
  cacheLifeMock: vi.fn(),
  cacheTagMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({
    collection: () => ({
      findOne: findOneMock,
      updateOne: updateOneMock,
    }),
  }),
}));

vi.mock("next/cache", () => ({
  cacheLife: cacheLifeMock,
  cacheTag: cacheTagMock,
  revalidateTag: revalidateTagMock,
}));

import {
  getLotterySyncStatus,
  markLotterySyncFailed,
  markLotterySyncStarted,
  markLotterySyncSucceeded,
} from "./lottery-sync-status";

const documentId = "lottery-draw-sync";

beforeEach(() => {
  vi.clearAllMocks();
  documents.clear();
  findOneMock.mockImplementation(async () => documents.get(documentId) ?? null);
  updateOneMock.mockImplementation(async (filter, update) => {
    const current = documents.get(documentId);
    if (filter.runId && current?.runId !== filter.runId) {
      return { matchedCount: 0, upsertedCount: 0 };
    }

    const next = {
      _id: documentId,
      ...(!current ? update.$setOnInsert : {}),
      ...(current ?? {}),
      ...update.$set,
    };
    documents.set(documentId, next);
    return { matchedCount: current ? 1 : 0, upsertedCount: current ? 0 : 1 };
  });
});

it("returns an idle status before the first sync attempt", async () => {
  await expect(getLotterySyncStatus()).resolves.toEqual({
    lastAttemptAt: null,
    lastSuccessAt: null,
    state: "idle",
    latestRound: null,
    errorSummary: null,
  });
});

it("preserves the last successful sync when a later run fails", async () => {
  const firstAttempt = new Date("2026-11-07T12:00:00.000Z");
  const firstSuccess = new Date("2026-11-07T12:00:03.000Z");
  const secondAttempt = new Date("2026-11-14T12:00:00.000Z");

  await markLotterySyncStarted("run-1", firstAttempt);
  await markLotterySyncSucceeded("run-1", firstSuccess, 1249);
  await markLotterySyncStarted("run-2", secondAttempt);
  await markLotterySyncFailed("run-2", secondAttempt, "source_unavailable");

  await expect(getLotterySyncStatus()).resolves.toEqual({
    lastAttemptAt: secondAttempt,
    lastSuccessAt: firstSuccess,
    state: "failed",
    latestRound: 1249,
    errorSummary: "source_unavailable",
  });
});

it("ignores a stale run completion after a newer run has started", async () => {
  const newerAttempt = new Date("2026-11-14T12:00:00.000Z");
  await markLotterySyncStarted("run-new", newerAttempt);

  await markLotterySyncSucceeded(
    "run-old",
    new Date("2026-11-14T12:00:01.000Z"),
    1250,
  );

  await expect(getLotterySyncStatus()).resolves.toMatchObject({
    lastAttemptAt: newerAttempt,
    state: "running",
    latestRound: null,
  });
});

it("caches shared status and expires the cache tag after each transition", async () => {
  const attemptedAt = new Date("2026-11-07T12:00:00.000Z");
  await markLotterySyncStarted("run-1", attemptedAt);
  await markLotterySyncSucceeded(
    "run-1",
    new Date("2026-11-07T12:00:03.000Z"),
    1249,
  );
  await markLotterySyncFailed("run-1", attemptedAt, "source_unavailable");
  await getLotterySyncStatus();

  expect(cacheLifeMock).toHaveBeenCalledWith("minutes");
  expect(cacheTagMock).toHaveBeenCalledWith("lottery-sync-status");
  expect(revalidateTagMock).toHaveBeenCalledTimes(3);
  expect(revalidateTagMock).toHaveBeenCalledWith("lottery-sync-status", {
    expire: 0,
  });
});
