import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, getMongoDbMock, drawsCollection, combinationsCollection } =
  vi.hoisted(() => ({
    db: { collection: vi.fn() },
    getMongoDbMock: vi.fn(),
    drawsCollection: { find: vi.fn() },
    combinationsCollection: { find: vi.fn(), updateOne: vi.fn() },
  }));

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: getMongoDbMock,
}));

import { reconcileSavedCombinationDrawResults } from "./reconcile-draw-results";

const userId = "65ab12cd34ef56ab78cd90ef";
const numbers = [1, 2, 3, 4, 5, 6] as const;
const draw = {
  roundNumber: 1,
  drawDate: new Date("2026-11-07T00:00:00.000Z"),
  numbers: [1, 2, 3, 4, 5, 7] as const,
  bonusNumber: 6,
  prizesByRank: [
    { rank: 1 as const, winnerCount: 1, amountPerWinner: 1000 },
    { rank: 2 as const, winnerCount: 2, amountPerWinner: 500 },
    { rank: 3 as const, winnerCount: 3, amountPerWinner: 300 },
    { rank: 4 as const, winnerCount: 4, amountPerWinner: 50 },
    { rank: 5 as const, winnerCount: 5, amountPerWinner: 5 },
  ],
};

function createCombination(overrides: Record<string, unknown> = {}) {
  return {
    _id: "combination-1",
    userId,
    source: "manual",
    numbers,
    trackingStartRound: 1,
    numberVersions: [],
    drawResults: [],
    createdAt: new Date("2026-11-01T00:00:00.000Z"),
    updatedAt: new Date("2026-11-01T00:00:00.000Z"),
    ...overrides,
  };
}

function setDocuments(documents: unknown[]) {
  drawsCollection.find.mockReturnValue({
    sort: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([draw]),
    }),
  });
  combinationsCollection.find.mockReturnValue({
    toArray: vi.fn().mockResolvedValue(documents),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.collection.mockImplementation((name: string) =>
    name === "lottery_draws" ? drawsCollection : combinationsCollection,
  );
  getMongoDbMock.mockResolvedValue(db);
  combinationsCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
});

describe("reconcileSavedCombinationDrawResults", () => {
  it("stores the per-round result with the applicable number snapshot", async () => {
    const oldNumbers = [1, 2, 3, 4, 5, 6] as const;
    const currentNumbers = [8, 9, 10, 11, 12, 13] as const;
    setDocuments([
      createCombination({
        numbers: currentNumbers,
        trackingStartRound: 2,
        numberVersions: [
          { numbers: oldNumbers, fromRound: 1, throughRound: 1 },
        ],
      }),
    ]);

    await expect(
      reconcileSavedCombinationDrawResults({ historyChanged: true }),
    ).resolves.toEqual({ updatedCount: 1 });

    expect(combinationsCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId, _id: "combination-1" }),
      {
        $set: {
          drawResults: [
            expect.objectContaining({
              roundNumber: 1,
              numbersSnapshot: oldNumbers,
              matchedNumberCount: 5,
              bonusMatched: true,
              rank: 2,
              amountPerWinner: 500,
            }),
          ],
          updatedAt: expect.any(Date),
        },
      },
    );
  });

  it("does not write again when the same round is reconciled twice", async () => {
    const document = createCombination();
    setDocuments([document]);
    await reconcileSavedCombinationDrawResults({ historyChanged: false });

    combinationsCollection.updateOne.mockClear();
    setDocuments([
      createCombination({
        drawResults: [
          {
            roundNumber: 1,
            drawDate: draw.drawDate,
            numbersSnapshot: numbers,
            matchedNumberCount: 5,
            bonusMatched: true,
            rank: 2,
            amountPerWinner: 500,
          },
        ],
      }),
    ]);

    await expect(
      reconcileSavedCombinationDrawResults({ historyChanged: false }),
    ).resolves.toEqual({ updatedCount: 0 });
    expect(combinationsCollection.updateOne).not.toHaveBeenCalled();
  });

  it("replaces a result when corrected draw or prize data changes", async () => {
    setDocuments([
      createCombination({
        drawResults: [
          {
            roundNumber: 1,
            drawDate: draw.drawDate,
            numbersSnapshot: numbers,
            matchedNumberCount: 4,
            bonusMatched: false,
            rank: 4,
            amountPerWinner: 50,
          },
        ],
      }),
    ]);

    await reconcileSavedCombinationDrawResults({ historyChanged: true });

    expect(combinationsCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
      expect.objectContaining({
        $set: expect.objectContaining({
          drawResults: [
            expect.objectContaining({ rank: 2, amountPerWinner: 500 }),
          ],
        }),
      }),
    );
  });

  it("fills a missing result on retry after an earlier save failed", async () => {
    setDocuments([createCombination()]);
    combinationsCollection.updateOne
      .mockRejectedValueOnce(new Error("temporary database failure"))
      .mockResolvedValueOnce({ matchedCount: 1 });

    await expect(
      reconcileSavedCombinationDrawResults({ historyChanged: false }),
    ).rejects.toThrow("temporary database failure");
    await expect(
      reconcileSavedCombinationDrawResults({ historyChanged: false }),
    ).resolves.toEqual({ updatedCount: 1 });
    expect(combinationsCollection.updateOne).toHaveBeenCalledTimes(2);
  });

  it("includes user and current document state in the conditional update", async () => {
    setDocuments([createCombination()]);
    combinationsCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

    await expect(
      reconcileSavedCombinationDrawResults({ historyChanged: true }),
    ).resolves.toEqual({ updatedCount: 0 });

    const [filter] = combinationsCollection.updateOne.mock.calls[0];
    expect(filter).toMatchObject({
      _id: "combination-1",
      userId,
      trackingStartRound: 1,
      numbers,
    });
    expect(filter.updatedAt).toEqual(new Date("2026-11-01T00:00:00.000Z"));
  });
});
