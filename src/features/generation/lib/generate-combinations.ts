import { z } from "zod";
import type { WeeklyAnalysis } from "@/features/analysis";

const LotteryNumberSchema = z.number().int().min(1).max(45);

export const GenerationConstraintsSchema = z.object({
  excludedNumbers: z.array(LotteryNumberSchema).default([]),
  oddCount: z.number().int().min(0).max(6).optional(),
  lowCount: z.number().int().min(0).max(6).optional(),
  minNumber: LotteryNumberSchema.optional(),
  maxNumber: LotteryNumberSchema.optional(),
  allowConsecutive: z.boolean().optional(),
});

export type GenerationConstraints = z.input<typeof GenerationConstraintsSchema>;
export type GeneratedCombination = { numbers: number[]; score: number };

type GenerateCombinationsInput = {
  analysis: WeeklyAnalysis;
  fixedNumbers: readonly number[];
  count: number;
  seed: string;
  constraints?: GenerationConstraints;
};

export function generateCombinations({
  analysis,
  fixedNumbers,
  count,
  seed,
  constraints: rawConstraints,
}: GenerateCombinationsInput): GeneratedCombination[] {
  const constraints = GenerationConstraintsSchema.parse(rawConstraints ?? {});
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 10 ||
    fixedNumbers.length > 6 ||
    fixedNumbers.some(
      (number) => !LotteryNumberSchema.safeParse(number).success,
    ) ||
    new Set(fixedNumbers).size !== fixedNumbers.length ||
    !seed
  )
    throw new Error("Invalid generation input");
  if (fixedNumbers.length === 6 && count > 1) {
    throw new Error("Six fixed numbers allow one combination only");
  }
  const excluded = new Set(constraints.excludedNumbers);
  if (
    fixedNumbers.some(
      (number) =>
        excluded.has(number) ||
        number < (constraints.minNumber ?? 1) ||
        number > (constraints.maxNumber ?? 45),
    )
  )
    throw new Error("Fixed numbers conflict with generation constraints");
  if (
    constraints.minNumber !== undefined &&
    constraints.maxNumber !== undefined &&
    constraints.minNumber > constraints.maxNumber
  ) {
    throw new Error("Impossible generation constraints: empty number range");
  }

  const pool = Array.from({ length: 45 }, (_, index) => index + 1).filter(
    (number) =>
      !excluded.has(number) &&
      !fixedNumbers.includes(number) &&
      number >= (constraints.minNumber ?? 1) &&
      number <= (constraints.maxNumber ?? 45),
  );
  if (pool.length < 6 - fixedNumbers.length) {
    throw new Error(
      "Impossible generation constraints: too few available numbers",
    );
  }
  const oddFixed = fixedNumbers.filter((number) => number % 2 === 1).length;
  const lowFixed = fixedNumbers.filter((number) => number <= 22).length;
  if (
    (constraints.oddCount !== undefined &&
      (oddFixed > constraints.oddCount ||
        oddFixed + 6 - fixedNumbers.length < constraints.oddCount)) ||
    (constraints.lowCount !== undefined &&
      (lowFixed > constraints.lowCount ||
        lowFixed + 6 - fixedNumbers.length < constraints.lowCount))
  )
    throw new Error("Impossible generation constraints: fixed number counts");

  const random = seededRandom(seed);
  const candidates = new Map<string, GeneratedCombination>();
  const maxAttempts = Math.max(2000, count * 2000);
  for (
    let attempt = 0;
    attempt < maxAttempts && candidates.size < count * 30;
    attempt += 1
  ) {
    const available = [...pool];
    const numbers = [...fixedNumbers];
    while (numbers.length < 6) {
      const index = Math.floor(random() * available.length);
      numbers.push(available[index]);
      available[index] = available[available.length - 1];
      available.pop();
    }
    numbers.sort((left, right) => left - right);
    if (!matchesConstraints(numbers, constraints)) continue;
    const key = numbers.join(",");
    if (!candidates.has(key)) {
      candidates.set(key, {
        numbers,
        score: scoreCombination(numbers, analysis),
      });
    }
  }
  if (candidates.size < count) {
    // Random sampling can miss rare, valid combinations. Exhaust the remaining
    // search space before reporting that the constraints are impossible.
    const shuffled = [...pool];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }
    const suffixOdd = Array.from({ length: shuffled.length + 1 }, () => 0);
    const suffixLow = Array.from({ length: shuffled.length + 1 }, () => 0);
    for (let index = shuffled.length - 1; index >= 0; index -= 1) {
      suffixOdd[index] = suffixOdd[index + 1] + (shuffled[index] % 2);
      suffixLow[index] = suffixLow[index + 1] + (shuffled[index] <= 22 ? 1 : 0);
    }
    const selected: number[] = [];
    const search = (
      start: number,
      selectedOdd: number,
      selectedLow: number,
    ): void => {
      if (candidates.size >= count) return;
      const slots = 6 - fixedNumbers.length - selected.length;
      if (shuffled.length - start < slots) return;
      if (constraints.oddCount !== undefined) {
        const required = constraints.oddCount - oddFixed - selectedOdd;
        if (
          required < 0 ||
          required > slots ||
          required > suffixOdd[start] ||
          slots - required > shuffled.length - start - suffixOdd[start]
        )
          return;
      }
      if (constraints.lowCount !== undefined) {
        const required = constraints.lowCount - lowFixed - selectedLow;
        if (
          required < 0 ||
          required > slots ||
          required > suffixLow[start] ||
          slots - required > shuffled.length - start - suffixLow[start]
        )
          return;
      }
      if (slots === 0) {
        const numbers = [...fixedNumbers, ...selected].sort(
          (left, right) => left - right,
        );
        if (!matchesConstraints(numbers, constraints)) return;
        const key = numbers.join(",");
        if (!candidates.has(key))
          candidates.set(key, {
            numbers,
            score: scoreCombination(numbers, analysis),
          });
        return;
      }
      for (let index = start; index <= shuffled.length - slots; index += 1) {
        const number = shuffled[index];
        if (
          constraints.allowConsecutive === false &&
          [...fixedNumbers, ...selected].some(
            (existing) => Math.abs(existing - number) === 1,
          )
        )
          continue;
        selected.push(number);
        search(
          index + 1,
          selectedOdd + (number % 2),
          selectedLow + (number <= 22 ? 1 : 0),
        );
        selected.pop();
        if (candidates.size >= count) return;
      }
    };
    search(0, 0, 0);
  }
  if (candidates.size < count) {
    throw new Error(
      "Impossible generation constraints: insufficient unique combinations",
    );
  }
  const compareCandidates = (
    left: GeneratedCombination,
    right: GeneratedCombination,
  ) =>
    right.score - left.score ||
    left.numbers.join(",").localeCompare(right.numbers.join(","));
  const rankedWindow = [...candidates.values()]
    .sort(compareCandidates)
    .slice(0, Math.min(count * 3, candidates.size));
  const sampled: GeneratedCombination[] = [];
  while (sampled.length < count) {
    const index = Math.floor(random() * rankedWindow.length);
    sampled.push(rankedWindow[index]);
    rankedWindow.splice(index, 1);
  }
  return sampled.sort(compareCandidates);
}

function matchesConstraints(
  numbers: readonly number[],
  constraints: z.output<typeof GenerationConstraintsSchema>,
): boolean {
  if (
    constraints.oddCount !== undefined &&
    numbers.filter((number) => number % 2 === 1).length !== constraints.oddCount
  )
    return false;
  if (
    constraints.lowCount !== undefined &&
    numbers.filter((number) => number <= 22).length !== constraints.lowCount
  )
    return false;
  if (
    constraints.allowConsecutive === false &&
    numbers.some(
      (number, index) => index > 0 && number === numbers[index - 1] + 1,
    )
  )
    return false;
  return true;
}

function scoreCombination(
  numbers: readonly number[],
  analysis: WeeklyAnalysis,
): number {
  if (analysis.drawCount === 0) return 0;
  const frequencies = new Map(
    analysis.numberFrequencies.map(({ number, count }) => [number, count]),
  );
  const frequencyScore =
    numbers.reduce(
      (total, number) => total + (frequencies.get(number) ?? 0),
      0,
    ) / analysis.drawCount;
  const oddCount = numbers.filter((number) => number % 2 === 1).length;
  const lowCount = numbers.filter((number) => number <= 22).length;
  const distributionScore =
    ((analysis.oddCountDistribution[oddCount] ?? 0) +
      (analysis.lowCountDistribution[lowCount] ?? 0)) /
    analysis.drawCount;
  const bandScore =
    analysis.numberBandCounts.reduce(
      (total, band) =>
        total +
        numbers.filter((number) => number >= band.start && number <= band.end)
          .length *
          band.count,
      0,
    ) /
    (analysis.drawCount * 6);
  const hasConsecutive = numbers.some(
    (number, index) => index > 0 && number === numbers[index - 1] + 1,
  );
  const consecutiveScore = hasConsecutive
    ? analysis.consecutiveDrawCount / analysis.drawCount
    : 1 - analysis.consecutiveDrawCount / analysis.drawCount;
  return Number(
    (frequencyScore + distributionScore + bandScore + consecutiveScore).toFixed(
      6,
    ),
  );
}

function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state = Math.imul(state ^ seed.charCodeAt(index), 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
