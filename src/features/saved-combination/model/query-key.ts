export const savedCombinationsQueryKey = (
  userId: string,
  page?: number,
  targetCombinationId?: string,
) =>
  page === undefined
    ? (["saved-combinations", userId] as const)
    : targetCombinationId
      ? (["saved-combinations", userId, page, targetCombinationId] as const)
      : (["saved-combinations", userId, page] as const);
