import { expect, it } from "vitest";
import { calculateWeeklyAnalysis } from "@/features/analysis";
import { summarizeGenerationAnalysis } from "./summarize-generation-analysis";

it("returns the top five positive frequencies and known gaps with numeric tie breaks", () => {
  const analysis = calculateWeeklyAnalysis([
    { roundNumber: 10, numbers: [1, 2, 3, 4, 5, 6] },
    { roundNumber: 11, numbers: [1, 2, 7, 8, 9, 10] },
    { roundNumber: 12, numbers: [1, 7, 11, 12, 13, 14] },
  ]);
  // Input order must not determine the ranking or be mutated by summarizing.
  analysis.numberFrequencies.reverse();
  const original = structuredClone(analysis);
  const expected = {
    mostFrequentNumbers: [
      { number: 1, count: 3 },
      { number: 2, count: 2 },
      { number: 7, count: 2 },
      { number: 3, count: 1 },
      { number: 4, count: 1 },
    ],
    longestCurrentAbsences: [
      { number: 3, drawsSinceLastAppearance: 2 },
      { number: 4, drawsSinceLastAppearance: 2 },
      { number: 5, drawsSinceLastAppearance: 2 },
      { number: 6, drawsSinceLastAppearance: 2 },
      { number: 2, drawsSinceLastAppearance: 1 },
    ],
  };
  expect(summarizeGenerationAnalysis(analysis)).toEqual(expected);
  expect(summarizeGenerationAnalysis(analysis)).toEqual(expected);
  expect(analysis).toEqual(original);
});

it("omits zero-frequency and never-seen numbers and preserves zero known gaps", () => {
  const analysis = calculateWeeklyAnalysis([]);
  expect(summarizeGenerationAnalysis(analysis)).toEqual({
    mostFrequentNumbers: [],
    longestCurrentAbsences: [],
  });
  analysis.numberFrequencies[0] = {
    number: 1,
    count: 1,
    drawsSinceLastAppearance: 0,
  };
  expect(summarizeGenerationAnalysis(analysis)).toEqual({
    mostFrequentNumbers: [{ number: 1, count: 1 }],
    longestCurrentAbsences: [{ number: 1, drawsSinceLastAppearance: 0 }],
  });
});
