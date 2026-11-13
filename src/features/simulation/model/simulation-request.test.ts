import { describe, expect, it } from "vitest";
import { SimulationRequestSchema } from "./simulation-request";

describe("SimulationRequestSchema", () => {
  it("defaults to five combinations per target round", () => {
    expect(SimulationRequestSchema.parse({})).toEqual({
      combinationsPerRound: 5,
    });
  });

  it.each([1, 5, 10])("accepts %i combinations per round", (count) => {
    expect(
      SimulationRequestSchema.parse({ combinationsPerRound: count }),
    ).toEqual({
      combinationsPerRound: count,
    });
  });

  it.each([0, 11, 1.5, "5"])(
    "rejects invalid combination count %s",
    (count) => {
      expect(
        SimulationRequestSchema.safeParse({ combinationsPerRound: count })
          .success,
      ).toBe(false);
    },
  );

  it("rejects unsupported fields such as an AI prompt", () => {
    expect(
      SimulationRequestSchema.safeParse({
        combinationsPerRound: 5,
        prompt: "AI",
      }).success,
    ).toBe(false);
  });
});
