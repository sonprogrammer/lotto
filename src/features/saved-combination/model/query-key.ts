export const savedCombinationsQueryKey = (userId: string, page?: number) =>
  page === undefined
    ? (["saved-combinations", userId] as const)
    : (["saved-combinations", userId, page] as const);
