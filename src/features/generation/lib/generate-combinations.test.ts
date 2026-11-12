import { describe, expect, it } from "vitest";
import { calculateWeeklyAnalysis } from "@/features/analysis";
import { generateCombinations } from "./generate-combinations";

const analysis = calculateWeeklyAnalysis([
  { roundNumber: 10, numbers: [1, 2, 3, 11, 23, 45] },
  { roundNumber: 11, numbers: [2, 4, 11, 22, 23, 44] },
]);

describe("generateCombinations", () => {
  it("includes fixed numbers and returns unique valid combinations", () => {
    const result = generateCombinations({
      analysis,
      fixedNumbers: [45, 2],
      count: 10,
      seed: "round-11-request-1",
    });

    expect(result).toHaveLength(10);
    expect(new Set(result.map(({ numbers }) => numbers.join(","))).size).toBe(
      10,
    );
    for (const { numbers, score } of result) {
      expect(numbers).toHaveLength(6);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      expect(new Set(numbers).size).toBe(6);
      expect(numbers.every((number) => number >= 1 && number <= 45)).toBe(true);
      expect(numbers).toContain(2);
      expect(numbers).toContain(45);
      expect(Number.isFinite(score)).toBe(true);
    }
  });

  it("reproduces the same combinations and scores for the same seed", () => {
    const input = { analysis, fixedNumbers: [7], count: 5, seed: "same" };
    expect(generateCombinations(input)).toEqual(generateCombinations(input));
  });

  it("changes candidates when the seed changes", () => {
    const input = { analysis, fixedNumbers: [], count: 5 };
    expect(generateCombinations({ ...input, seed: "first" })).not.toEqual(
      generateCombinations({ ...input, seed: "second" }),
    );
  });

  it("varies constrained batches across seeds while preserving ranked unique valid results", () => {
    const input = {
      analysis,
      fixedNumbers: [1, 2, 3, 4, 5],
      count: 5,
      constraints: { excludedNumbers: [45], maxNumber: 40 },
    };
    const batches = ["first", "second", "third"].map((seed) => {
      const batch = generateCombinations({ ...input, seed });
      expect(batch).toEqual(generateCombinations({ ...input, seed }));
      expect(batch).toHaveLength(5);
      expect(new Set(batch.map(({ numbers }) => numbers.join(","))).size).toBe(
        5,
      );
      expect(batch.map(({ score }) => score)).toEqual(
        batch.map(({ score }) => score).sort((a, b) => b - a),
      );
      for (const { numbers } of batch) {
        expect(numbers.slice(0, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(numbers).toHaveLength(6);
        expect(numbers[5]).toBeGreaterThan(5);
        expect(numbers[5]).toBeLessThanOrEqual(40);
      }
      return batch;
    });
    expect(batches[0]).not.toEqual(batches[1]);
    expect(batches[1]).not.toEqual(batches[2]);
    expect(batches[0]).not.toEqual(batches[2]);
  });

  it("applies number and parity constraints", () => {
    const result = generateCombinations({
      analysis,
      fixedNumbers: [3],
      count: 5,
      seed: "constraints",
      constraints: { excludedNumbers: [1, 2], oddCount: 3, lowCount: 3 },
    });
    for (const { numbers } of result) {
      expect(numbers).not.toContain(1);
      expect(numbers).not.toContain(2);
      expect(numbers.filter((number) => number % 2 === 1)).toHaveLength(3);
      expect(numbers.filter((number) => number <= 22)).toHaveLength(3);
    }
  });

  it("finds a feasible combination when narrow constraints evade random sampling", () => {
    const result = generateCombinations({
      analysis,
      fixedNumbers: [],
      count: 1,
      seed: "narrow",
      constraints: { oddCount: 6, lowCount: 6 },
    });

    expect(result).toHaveLength(1);
    expect(result[0].numbers).toHaveLength(6);
    expect(
      result[0].numbers.every((number) => number <= 22 && number % 2 === 1),
    ).toBe(true);
  });

  it("rejects constraints conflicting with fixed numbers", () => {
    expect(() =>
      generateCombinations({
        analysis,
        fixedNumbers: [1],
        count: 1,
        seed: "conflict",
        constraints: { excludedNumbers: [1] },
      }),
    ).toThrow(/conflict/i);
  });

  it("rejects impossible constraints instead of relaxing them", () => {
    expect(() =>
      generateCombinations({
        analysis,
        fixedNumbers: [1, 3, 5, 7],
        count: 1,
        seed: "impossible",
        constraints: { oddCount: 2 },
      }),
    ).toThrow(/impossible/i);
  });

  it("scores candidates using the supplied statistics", () => {
    const input = {
      fixedNumbers: [2, 4, 11, 22, 23, 44],
      count: 1,
      seed: "score",
    };
    const historical = generateCombinations({ analysis, ...input });
    const empty = generateCombinations({
      analysis: calculateWeeklyAnalysis([]),
      ...input,
    });
    expect(historical[0].score).not.toBe(empty[0].score);
  });
});
