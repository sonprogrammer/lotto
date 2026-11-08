import { describe, expect, it } from "vitest";
import { generateLottoNumbers } from "./generate-lotto-numbers";

describe("generateLottoNumbers", () => {
  it("returns six distinct sorted numbers between 1 and 45", () => {
    const samples = [45, 46, 47, 48, 49, 50];
    const numbers = generateLottoNumbers(() => samples.shift() ?? 0);

    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(numbers).size).toBe(6);
    expect(numbers.every((number) => number >= 1 && number <= 45)).toBe(true);
  });

  it("rejects modulo-biased values and duplicate picks", () => {
    const samples = [45, 45, 4_294_967_295, 46, 47, 48, 49, 50, 51];
    let drawCount = 0;
    const numbers = generateLottoNumbers(() => {
      drawCount += 1;
      return samples.shift() ?? 0;
    });

    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(drawCount).toBe(8);
  });
});
