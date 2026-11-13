export type LottoNumberTone = "gold" | "blue" | "red" | "gray" | "green";

export function getLottoNumberTone(number?: number): LottoNumberTone {
  if (number === undefined || number <= 10) return "gold";
  if (number <= 20) return "blue";
  if (number <= 30) return "red";
  if (number <= 40) return "gray";
  return "green";
}
