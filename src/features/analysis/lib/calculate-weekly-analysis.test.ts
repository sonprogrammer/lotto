import { describe, expect, it } from "vitest";
import { calculateWeeklyAnalysis } from "./calculate-weekly-analysis";

const draws = [
  { roundNumber: 11, numbers: [2, 4, 11, 22, 23, 44] },
  { roundNumber: 10, numbers: [1, 2, 3, 11, 23, 45] },
];

describe("calculateWeeklyAnalysis", () => {
  it("calculates frequencies, gaps, distributions, bands, and consecutive patterns", () => {
    const analysis = calculateWeeklyAnalysis(draws);

    expect(analysis).toMatchObject({ drawCount: 2, latestRound: 11 });
    expect(
      analysis.numberFrequencies.find(({ number }) => number === 2),
    ).toEqual({
      number: 2,
      count: 2,
      drawsSinceLastAppearance: 0,
    });
    expect(
      analysis.numberFrequencies.find(({ number }) => number === 1),
    ).toEqual({
      number: 1,
      count: 1,
      drawsSinceLastAppearance: 1,
    });
    expect(
      analysis.numberFrequencies.find(({ number }) => number === 5),
    ).toEqual({
      number: 5,
      count: 0,
      drawsSinceLastAppearance: null,
    });
    expect(analysis.oddCountDistribution[5]).toBe(1);
    expect(analysis.oddCountDistribution[2]).toBe(1);
    expect(analysis.lowCountDistribution[4]).toBe(2);
    expect(analysis.numberBandCounts).toEqual([
      { start: 1, end: 10, count: 5 },
      { start: 11, end: 20, count: 2 },
      { start: 21, end: 30, count: 3 },
      { start: 31, end: 40, count: 0 },
      { start: 41, end: 45, count: 2 },
    ]);
    expect(analysis.consecutiveDrawCount).toBe(2);
    expect(analysis.consecutivePairCount).toBe(3);
    expect(analysis.longestConsecutiveRun).toBe(3);
  });

  it("returns an empty result without inventing statistics", () => {
    const analysis = calculateWeeklyAnalysis([]);

    expect(analysis.drawCount).toBe(0);
    expect(analysis.latestRound).toBeNull();
    expect(analysis.numberFrequencies).toHaveLength(45);
    expect(analysis.numberFrequencies.every(({ count }) => count === 0)).toBe(
      true,
    );
    expect(
      analysis.numberFrequencies.every(
        ({ drawsSinceLastAppearance }) => drawsSinceLastAppearance === null,
      ),
    ).toBe(true);
  });

  it("rejects malformed draw records", () => {
    expect(() =>
      calculateWeeklyAnalysis([
        { roundNumber: 1, numbers: [1, 1, 3, 4, 5, 6] },
      ]),
    ).toThrow("Invalid lottery draw data");
  });
});
