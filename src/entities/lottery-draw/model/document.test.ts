import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { LotteryDrawDocumentSchema } from "./document";

describe("LotteryDrawDocumentSchema", () => {
  const validDocument = {
    _id: new ObjectId(),
    roundNumber: 1162,
    numbers: [5, 10, 16, 23, 35, 44],
    bonusNumber: 7,
    prizesByRank: [
      { rank: 1, winnerCount: 1, amountPerWinner: 1_000_000_000 },
      { rank: 2, winnerCount: 2, amountPerWinner: 50_000_000 },
      { rank: 3, winnerCount: 80, amountPerWinner: 1_500_000 },
      { rank: 4, winnerCount: 4000, amountPerWinner: 50_000 },
      { rank: 5, winnerCount: 70000, amountPerWinner: 5_000 },
    ],
  };

  it("accepts a valid draw document", () => {
    expect(LotteryDrawDocumentSchema.safeParse(validDocument).success).toBe(
      true,
    );
  });

  it.each([
    { roundNumber: 0 },
    { numbers: [1, 2, 3, 4, 5] },
    { numbers: [1, 2, 3, 4, 5, 5] },
    { numbers: [1, 2, 3, 4, 5, 46] },
    { bonusNumber: 5 },
    { prizesByRank: [{ rank: 1, winnerCount: -1, amountPerWinner: 0 }] },
    {
      prizesByRank: [
        { rank: 1, winnerCount: 1, amountPerWinner: 1 },
        { rank: 1, winnerCount: 2, amountPerWinner: 2 },
      ],
    },
  ])("rejects an invalid draw document field", (override) => {
    expect(
      LotteryDrawDocumentSchema.safeParse({ ...validDocument, ...override })
        .success,
    ).toBe(false);
  });
});
