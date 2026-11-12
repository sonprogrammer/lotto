import { describe, expect, it } from "vitest";
import { GenerationRequestSchema } from "./generation-request";

describe("GenerationRequestSchema", () => {
  it("defaults to no fixed numbers, five combinations and the latest 30 draws", () => {
    expect(GenerationRequestSchema.parse({})).toEqual({
      fixedNumbers: [],
      count: 5,
      period: { type: "recent", count: 30 },
    });
  });

  it.each([0, 1, 2, 3, 4, 5, 6])(
    "accepts %s unique fixed numbers without a method",
    (length) => {
      const fixedNumbers = Array.from({ length }, (_, index) => index + 1);
      expect(
        GenerationRequestSchema.safeParse({ fixedNumbers, count: 1 }).success,
      ).toBe(true);
    },
  );

  it.each([[0], [46], [1.5], [2, 2], [1, 2, 3, 4, 5, 6, 7]])(
    "rejects invalid fixed numbers %j",
    (...fixedNumbers) => {
      expect(GenerationRequestSchema.safeParse({ fixedNumbers }).success).toBe(
        false,
      );
    },
  );

  it("requires exactly one combination when all six numbers are fixed", () => {
    const fixedNumbers = [1, 2, 3, 4, 5, 6];
    expect(
      GenerationRequestSchema.safeParse({ fixedNumbers, count: 2 }).success,
    ).toBe(false);
    expect(GenerationRequestSchema.safeParse({ fixedNumbers }).success).toBe(
      false,
    );
    expect(
      GenerationRequestSchema.safeParse({ fixedNumbers, count: 1 }).success,
    ).toBe(true);
  });

  it("accepts an optional trimmed prompt up to 500 characters", () => {
    expect(GenerationRequestSchema.parse({ prompt: " 홀수 3개 " }).prompt).toBe(
      "홀수 3개",
    );
    expect(
      GenerationRequestSchema.safeParse({ prompt: "x".repeat(500) }).success,
    ).toBe(true);
    expect(
      GenerationRequestSchema.safeParse({ prompt: "x".repeat(501) }).success,
    ).toBe(false);
  });

  it.each([1, 10])("accepts count %s", (count) => {
    expect(GenerationRequestSchema.parse({ count }).count).toBe(count);
  });

  it.each([0, 11, 1.5])("rejects count %s", (count) => {
    expect(GenerationRequestSchema.safeParse({ count }).success).toBe(false);
  });
});
