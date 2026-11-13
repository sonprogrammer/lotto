import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { collection, getMongoDbMock } = vi.hoisted(() => ({
  collection: {
    createIndex: vi.fn(),
    insertOne: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
  },
  getMongoDbMock: vi.fn(),
}));

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import {
  createSimulationRun,
  getSimulationRun,
  listSimulationRuns,
} from "./simulation-store";
import { SimulationRunDocumentSchema } from "../model/simulation-run";

const userId = "65ab12cd34ef56ab78cd90ef";
const runId = new ObjectId("65ab12cd34ef56ab78cd9001");

function createRunDocument() {
  return SimulationRunDocumentSchema.parse({
    _id: runId,
    userId,
    createdAt: new Date("2026-11-14T00:00:00.000Z"),
    settings: {
      targetRoundCount: 30,
      analysisDrawCount: 30,
      combinationsPerRound: 5,
      ticketCost: 1_000,
    },
    generatorVersion: "stats-v1",
    baseLatestRound: 100,
    totals: {
      combinationsEvaluated: 150,
      totalCost: 150_000,
      knownPayoutTotal: 0,
      unknownPayoutCount: 0,
      netKnownPayout: -150_000,
      hitsByRank: [
        { rank: 1, count: 0 },
        { rank: 2, count: 0 },
        { rank: 3, count: 0 },
        { rank: 4, count: 0 },
        { rank: 5, count: 0 },
      ],
    },
    rounds: Array.from({ length: 30 }, (_, index) => {
      const roundNumber = 71 + index;
      return {
        roundNumber,
        drawDate: new Date("2026-11-07T00:00:00.000Z"),
        winningNumbers: [1, 2, 3, 4, 5, 6],
        bonusNumber: 7,
        analysisFirstRound: roundNumber - 30,
        analysisLatestRound: roundNumber - 1,
        seed: `historical-simulation:v1:${roundNumber}:5`,
        combinations: Array.from({ length: 5 }, () => ({
          numbers: [8, 9, 10, 11, 12, 13],
          matchedNumberCount: 0,
          bonusMatched: false,
          rank: null,
          amountPerWinner: 0,
        })),
      };
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getMongoDbMock.mockResolvedValue({ collection: () => collection });
  collection.createIndex.mockResolvedValue("userId_1_createdAt_-1");
  collection.insertOne.mockResolvedValue({ insertedId: runId });
  collection.find.mockReturnValue({
    sort: vi.fn().mockReturnValue({
      limit: vi
        .fn()
        .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
    }),
  });
  collection.findOne.mockResolvedValue(null);
});

describe("createSimulationRun", () => {
  it("stores a validated run under the given user", async () => {
    const run = createRunDocument();
    const draft = {
      settings: run.settings,
      generatorVersion: run.generatorVersion,
      baseLatestRound: run.baseLatestRound,
      totals: run.totals,
      rounds: run.rounds,
    };

    const result = await createSimulationRun(userId, draft);

    expect(collection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId, settings: draft.settings }),
    );
    const insertedDocument = collection.insertOne.mock.calls[0][0];
    expect(result).toMatchObject({
      id: insertedDocument._id.toHexString(),
      userId,
    });
    expect(result).not.toHaveProperty("_id");
  });
});

describe("listSimulationRuns", () => {
  it("lists only the requested user's summaries without round details", async () => {
    const document = createRunDocument();
    const toArray = vi.fn().mockResolvedValue([document]);
    const limit = vi.fn().mockReturnValue({ toArray });
    const sort = vi.fn().mockReturnValue({ limit });
    collection.find.mockReturnValue({ sort });

    const result = await listSimulationRuns(userId, 20);

    expect(collection.find).toHaveBeenCalledWith(
      { userId },
      { projection: { rounds: 0 } },
    );
    expect(sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(limit).toHaveBeenCalledWith(20);
    expect(result[0]).toMatchObject({
      id: runId.toHexString(),
      baseLatestRound: 100,
    });
    expect(result[0]).not.toHaveProperty("rounds");
  });
});

describe("getSimulationRun", () => {
  it("queries by both run id and user id", async () => {
    collection.findOne.mockResolvedValue(createRunDocument());

    const result = await getSimulationRun(userId, runId.toHexString());

    expect(collection.findOne).toHaveBeenCalledWith({ _id: runId, userId });
    expect(result).toMatchObject({ id: runId.toHexString(), userId });
  });

  it("returns null for an invalid id without querying MongoDB", async () => {
    await expect(getSimulationRun(userId, "invalid-id")).resolves.toBeNull();

    expect(collection.findOne).not.toHaveBeenCalled();
  });

  it("returns null when the run belongs to another user", async () => {
    collection.findOne.mockResolvedValue(null);

    await expect(
      getSimulationRun(userId, runId.toHexString()),
    ).resolves.toBeNull();
    expect(collection.findOne).toHaveBeenCalledWith({ _id: runId, userId });
  });
});
