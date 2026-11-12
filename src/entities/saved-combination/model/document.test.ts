import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { SavedCombinationDocumentSchema } from "./document";

describe("SavedCombinationDocumentSchema", () => {
  const validDocument = {
    _id: new ObjectId(),
    userId: "65ab12cd34ef56ab78cd90ef",
    targetRound: 1163,
    numbers: [2, 9, 18, 24, 33, 41],
    analysisSummary: "과거 공개 회차의 홀짝·구간 분포를 참고했습니다.",
    createdAt: new Date("2026-11-08T00:00:00.000Z"),
  };

  it("accepts a valid saved combination document", () => {
    expect(
      SavedCombinationDocumentSchema.safeParse(validDocument).success,
    ).toBe(true);
  });

  it("strips the legacy generation method from parsed output", () => {
    const result = SavedCombinationDocumentSchema.safeParse({
      ...validDocument,
      generationMethod: "ai-assisted",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("generationMethod");
    }
  });

  it.each([
    { userId: "invalid" },
    { targetRound: 0 },
    { numbers: [2, 9, 18, 24, 33, 33] },
    { analysisSummary: "  " },
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
