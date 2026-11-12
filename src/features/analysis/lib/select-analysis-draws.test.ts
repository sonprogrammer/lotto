import { describe, expect, it } from "vitest";
import { selectAnalysisDraws } from "./select-analysis-draws";

const draws = [
  { roundNumber: 1, numbers: [1, 2, 3, 4, 5, 6] },
  { roundNumber: 2, numbers: [7, 8, 9, 10, 11, 12] },
  { roundNumber: 3, numbers: [13, 14, 15, 16, 17, 18] },
  { roundNumber: 4, numbers: [19, 20, 21, 22, 23, 24] },
];

describe("selectAnalysisDraws", () => {
  it("selects the most recent requested rounds and reports their range", () => {
    expect(selectAnalysisDraws(draws, { type: "recent", count: 2 })).toEqual({
      draws: [draws[2], draws[3]],
      summary: {
        type: "recent",
        count: 2,
        drawCount: 2,
        firstRound: 3,
        latestRound: 4,
      },
    });
  });

  it("selects all available rounds for the all-history period", () => {
    expect(selectAnalysisDraws(draws, { type: "all" })).toEqual({
      draws,
      summary: {
        type: "all",
        count: null,
        drawCount: 4,
        firstRound: 1,
        latestRound: 4,
      },
    });
  });

  it("rejects a recent period larger than available history", () => {
    expect(() =>
      selectAnalysisDraws(draws, { type: "recent", count: 5 }),
    ).toThrow("Requested analysis period exceeds available lottery draws");
  });
});
