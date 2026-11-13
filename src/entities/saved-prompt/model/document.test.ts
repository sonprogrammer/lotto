import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { SavedPromptDocumentSchema } from "./document";

describe("SavedPromptDocumentSchema", () => {
  const validDocument = {
    _id: new ObjectId(),
    userId: "65ab12cd34ef56ab78cd90ef",
    title: "균형 조합",
    content: "홀짝과 구간 균형을 분석해서 추천해줘.",
    sortOrder: 0,
    createdAt: new Date("2026-11-08T00:00:00.000Z"),
    updatedAt: new Date("2026-11-08T00:00:00.000Z"),
  };

  it("accepts a valid saved prompt document", () => {
    expect(SavedPromptDocumentSchema.safeParse(validDocument).success).toBe(
      true,
    );
  });

  it.each([
    { userId: "invalid" },
    { title: "   " },
    { content: "   " },
    { title: "가".repeat(31) },
    { content: "가".repeat(301) },
    { sortOrder: -1 },
    { sortOrder: 5 },
    { createdAt: "2026-11-08T00:00:00.000Z" },
    { updatedAt: new Date("2026-11-07T23:59:59.999Z") },
  ])("rejects an invalid saved prompt field", (override) => {
    expect(
      SavedPromptDocumentSchema.safeParse({ ...validDocument, ...override })
        .success,
    ).toBe(false);
  });
});
