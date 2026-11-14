export const MAX_GUEST_DRAWS = 3;

export function getGuestDrawCount(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) return 0;

  const count = Number(value);
  if (!Number.isSafeInteger(count)) return 0;

  return Math.min(Math.max(count, 0), MAX_GUEST_DRAWS);
}
