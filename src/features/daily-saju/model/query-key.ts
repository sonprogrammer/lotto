export function sajuProfileQueryKey(userId: string) {
  return ["saju-profile", userId] as const;
}

export function dailySajuRecommendationQueryKey(
  userId: string,
  dateKey: string,
) {
  return ["daily-saju-recommendation", userId, dateKey] as const;
}
