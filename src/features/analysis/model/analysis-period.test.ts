import { describe, expect, it } from "vitest";
import { AnalysisPeriodSchema } from "./analysis-period";

describe("AnalysisPeriodSchema", () => {
  it("accepts all history and a positive recent draw count", () => {
    expect(AnalysisPeriodSchema.parse({ type: "all" })).toEqual({
      type: "all",
    });
    expect(AnalysisPeriodSchema.parse({ type: "recent", count: 15 })).toEqual({
      type: "recent",
      count: 15,
    });
  });

  it.each([
    { type: "recent", count: 0 },
    { type: "recent", count: 1.5 },
    { type: "recent", count: "15" },
    { type: "unknown" },
  ])("rejects invalid period input: %o", (period) => {
    expect(AnalysisPeriodSchema.safeParse(period).success).toBe(false);
  });
});
