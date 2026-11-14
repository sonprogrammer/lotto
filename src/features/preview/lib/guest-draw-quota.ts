export const MAX_GUEST_DRAWS = 3;

export function getGuestDrawCount(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) return 0;

  const count = Number(value);
  if (count >= MAX_GUEST_DRAWS) return MAX_GUEST_DRAWS;
  if (!Number.isSafeInteger(count)) return 0;

  return Math.max(count, 0);
}
