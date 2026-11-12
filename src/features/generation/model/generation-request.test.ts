import { describe, expect, it } from "vitest";
import { GenerationRequestSchema } from "./generation-request";

describe("GenerationRequestSchema", () => {
  const selectedRequest = { method: "selected", fixedNumbers: [1, 7] };

  it("defaults to five combinations and the latest 30 draws", () => {
    expect(GenerationRequestSchema.parse({ method: "automatic" })).toEqual({
      method: "automatic",
      fixedNumbers: [],
      count: 5,
      period: { type: "recent", count: 30 },
    });
  });

  it.each([
    { fixedNumbers: [0] },
    { fixedNumbers: [46] },
    { fixedNumbers: [1.5] },
    { fixedNumbers: [2, 2] },
  ])("rejects invalid fixed numbers %j", ({ fixedNumbers }) => {
    expect(
      GenerationRequestSchema.safeParse({
        ...selectedRequest,
        fixedNumbers,
      }).success,
    ).toBe(false);
  });

  it("rejects multiple combinations when all six numbers are fixed", () => {
    expect(
      GenerationRequestSchema.safeParse({
        ...selectedRequest,
        fixedNumbers: [1, 2, 3, 4, 5, 6],
        count: 2,
      }).success,
    ).toBe(false);
    expect(
      GenerationRequestSchema.safeParse({
        ...selectedRequest,
        fixedNumbers: [1, 2, 3, 4, 5, 6],
        count: 1,
      }).success,
    ).toBe(true);
  });

  it("enforces method-specific fixed numbers and prompt limits", () => {
    expect(
      GenerationRequestSchema.safeParse({
        method: "automatic",
        fixedNumbers: [1],
      }).success,
    ).toBe(false);
    expect(
      GenerationRequestSchema.safeParse({ method: "selected" }).success,
    ).toBe(false);
    expect(
      GenerationRequestSchema.safeParse({
        method: "ai-assisted",
        prompt: "x".repeat(501),
      }).success,
    ).toBe(false);
    expect(
      GenerationRequestSchema.safeParse({
        method: "ai-assisted",
        fixedNumbers: [7],
        prompt: "홀수 3개",
      }).success,
    ).toBe(true);
  });

  it.each([0, 11, 1.5])("rejects count %s", (count) => {
    expect(
      GenerationRequestSchema.safeParse({
        method: "automatic",
        count,
      }).success,
    ).toBe(false);
  });
});
