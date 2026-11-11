import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { AppSessionDocumentSchema } from "./session-document";

describe("AppSessionDocumentSchema", () => {
  const validDocument = {
    userId: "65ab12cd34ef56ab78cd90ef",
    tokenHash: "a".repeat(64),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt: new Date("2026-01-31T00:00:00.000Z"),
  };

  it("accepts a valid session document", () => {
    expect(AppSessionDocumentSchema.safeParse(validDocument).success).toBe(
      true,
    );
  });

  it("accepts a MongoDB-generated document ID", () => {
    expect(
      AppSessionDocumentSchema.safeParse({
        ...validDocument,
        _id: new ObjectId(),
      }).success,
    ).toBe(true);
  });

  it.each([
    { userId: "not-an-object-id" },
    { tokenHash: "" },
    { _id: "not-an-object-id" },
    { expiresAt: new Date("2025-12-31T23:59:59.999Z") },
    { expiresAt: new Date("2026-01-01T00:00:00.000Z") },
  ])("rejects an invalid session document field", (override) => {
    expect(
      AppSessionDocumentSchema.safeParse({ ...validDocument, ...override })
        .success,
    ).toBe(false);
  });
});
