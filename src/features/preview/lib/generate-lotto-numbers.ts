const NUMBER_COUNT = 6;
const NUMBER_RANGE = 45;
const UINT32_RANGE = 2 ** 32;
const ACCEPTED_SAMPLE_LIMIT =
  Math.floor(UINT32_RANGE / NUMBER_RANGE) * NUMBER_RANGE;

export function generateLottoNumbers(
  randomUint32: () => number = () =>
    globalThis.crypto.getRandomValues(new Uint32Array(1))[0] ?? 0,
): number[] {
  const numbers = new Set<number>();

  while (numbers.size < NUMBER_COUNT) {
    const sample = randomUint32();

    if (sample >= ACCEPTED_SAMPLE_LIMIT) {
      continue;
    }

    numbers.add((sample % NUMBER_RANGE) + 1);
  }

  return [...numbers].sort((first, second) => first - second);
}
