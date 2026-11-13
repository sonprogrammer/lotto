import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { SavedCombinationDocumentSchema } from "./document";

describe("SavedCombinationDocumentSchema", () => {
  const validDocument = {
    _id: new ObjectId(),
    userId: "65ab12cd34ef56ab78cd90ef",
    source: "ai-assisted" as const,
    numbers: [2, 9, 18, 24, 33, 41],
    analysisSummary: "과거 공개 회차의 홀짝·구간 분포를 참고했습니다.",
    trackingStartRound: 1163,
    numberVersions: [],
    drawResults: [],
    createdAt: new Date("2026-11-08T00:00:00.000Z"),
    updatedAt: new Date("2026-11-08T00:00:00.000Z"),
  };

  it("accepts a valid saved combination document", () => {
    expect(
      SavedCombinationDocumentSchema.safeParse(validDocument).success,
    ).toBe(true);
  });

  it("accepts a manually saved combination without an AI summary", () => {
    const result = SavedCombinationDocumentSchema.safeParse({
      ...validDocument,
      source: "manual",
      analysisSummary: undefined,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ source: "manual" });
      expect(result.data.analysisSummary).toBeUndefined();
    }
  });

  it("requires the saved AI explanation for AI-generated combinations", () => {
    const withoutSummary = Object.fromEntries(
      Object.entries(validDocument).filter(
        ([key]) => key !== "analysisSummary",
      ),
    );

    expect(
      SavedCombinationDocumentSchema.safeParse(withoutSummary).success,
    ).toBe(false);
  });

  it("preserves old number versions and per-draw number snapshots", () => {
    const result = SavedCombinationDocumentSchema.safeParse({
      ...validDocument,
      numberVersions: [
        {
          numbers: [1, 2, 3, 4, 5, 6],
          fromRound: 1163,
          throughRound: 1164,
        },
      ],
      drawResults: [
        {
          roundNumber: 1163,
          drawDate: new Date("2026-11-08T00:00:00.000Z"),
          numbersSnapshot: [1, 2, 3, 4, 5, 6],
          matchedNumberCount: 1,
          bonusMatched: false,
          rank: null,
          amountPerWinner: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it.each([
    { userId: "invalid" },
    { trackingStartRound: 0 },
    { numbers: [2, 9, 18, 24, 33, 33] },
    { analysisSummary: "  " },
    { source: "unknown" },
    {
      numberVersions: [
        { numbers: [1, 2, 3, 4, 5, 6], fromRound: 1165, throughRound: 1164 },
      ],
    },
    { drawResults: [{ roundNumber: 1163 }] },
    { createdAt: "2026-11-08T00:00:00.000Z" },
  ])("rejects an invalid saved combination field", (override) => {
    expect(
      SavedCombinationDocumentSchema.safeParse({
        ...validDocument,
        ...override,
      }).success,
    ).toBe(false);
  });
});
