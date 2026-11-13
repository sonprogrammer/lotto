import { describe, expect, it } from "vitest";
import {
  SavedCombinationCreateSchema,
  SavedCombinationDeleteSchema,
} from "./input";

describe("saved combination inputs", () => {
  it("accepts manual and AI-assisted combinations with a summary", () => {
    expect(
      SavedCombinationCreateSchema.safeParse({
        source: "manual",
        numbers: [1, 2, 3, 4, 5, 6],
      }).success,
    ).toBe(true);
    expect(
      SavedCombinationCreateSchema.safeParse({
        source: "ai-assisted",
        numbers: [1, 2, 3, 4, 5, 6],
        analysisSummary: "통계 설명",
      }).success,
    ).toBe(true);
  });

  it("requires an explanation for AI-assisted combinations", () => {
    expect(
      SavedCombinationCreateSchema.safeParse({
        source: "ai-assisted",
        numbers: [1, 2, 3, 4, 5, 6],
      }).success,
    ).toBe(false);
  });

  it("accepts only explicit delete-all or valid selected IDs", () => {
    expect(SavedCombinationDeleteSchema.safeParse({ all: true }).success).toBe(
      true,
    );
    expect(
      SavedCombinationDeleteSchema.safeParse({
        ids: ["65ab12cd34ef56ab78cd9001"],
      }).success,
    ).toBe(true);
    expect(SavedCombinationDeleteSchema.safeParse({ all: false }).success).toBe(
      false,
    );
  });
});
