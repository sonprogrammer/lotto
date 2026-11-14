import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { DailySajuRecommendationDocumentSchema } from "./document";

describe("DailySajuRecommendationDocumentSchema", () => {
  const base = {
    _id: new ObjectId(),
    userId: "65ab12cd34ef56ab78cd90ef",
    dateKey: "2026-11-14",
    createdAt: new Date("2026-11-14T00:00:00.000Z"),
    updatedAt: new Date("2026-11-14T00:00:00.000Z"),
  };

  it("accepts a generating claim with an expiry", () => {
    expect(
      DailySajuRecommendationDocumentSchema.safeParse({
        ...base,
        status: "generating",
        leaseExpiresAt: new Date("2026-11-14T00:00:30.000Z"),
      }).success,
    ).toBe(true);
  });

  it.each([1, 45])("accepts a ready result with number %s", (number) => {
    expect(
      DailySajuRecommendationDocumentSchema.safeParse({
        ...base,
        status: "ready",
        number,
        explanation: "오늘의 흐름을 떠올리게 하는 숫자예요.",
      }).success,
    ).toBe(true);
  });

  it.each([0, 46, 1.5])(
    "rejects an invalid recommendation number %s",
    (number) => {
      expect(
        DailySajuRecommendationDocumentSchema.safeParse({
          ...base,
          status: "ready",
          number,
          explanation: "오늘의 흐름을 떠올리게 하는 숫자예요.",
        }).success,
      ).toBe(false);
    },
  );

  it.each([
    { status: "ready", number: null, explanation: "숫자가 빠짐" },
    { status: "generating", number: 10, explanation: "아직 생성 중" },
    { status: "generating" },
    {
      status: "ready",
      number: 10,
      explanation: "완료",
      leaseExpiresAt: new Date(),
    },
    { status: "ready", number: 10, explanation: "완료", dateKey: "2026-02-30" },
    { status: "ready", number: 10, explanation: "완료", userId: "invalid" },
  ])("rejects an inconsistent recommendation document: %j", (override) => {
    expect(
      DailySajuRecommendationDocumentSchema.safeParse({
        ...base,
        number: 10,
        explanation: "오늘의 흐름을 떠올리게 하는 숫자예요.",
        ...override,
      }).success,
    ).toBe(false);
  });
});
