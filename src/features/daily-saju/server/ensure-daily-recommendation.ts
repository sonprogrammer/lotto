import {
  claimDailyRecommendation,
  completeDailyRecommendation,
  getDailyRecommendation,
  releaseDailyRecommendationClaim,
} from "@/entities/daily-saju/server/daily-saju-store";
import { getSajuProfile } from "@/entities/user/server/saju-profile-store";
import { calculateSajuContext } from "./calculate-saju-context";
import { getGroqDailyNumber } from "./groq-daily-number";

export class SajuProfileRequiredError extends Error {
  constructor() {
    super("Saju profile is required");
    this.name = "SajuProfileRequiredError";
  }
}

export class DailyRecommendationClaimLostError extends Error {
  constructor() {
    super("Daily recommendation generation claim was lost");
    this.name = "DailyRecommendationClaimLostError";
  }
}

export async function ensureDailyRecommendation(
  userId: string,
  dateKey: string,
) {
  if (!(await getSajuProfile(userId))) throw new SajuProfileRequiredError();

  const claim = await claimDailyRecommendation(userId, dateKey);
  if (!claim.acquired) return claim.recommendation;

  try {
    const profile = await getSajuProfile(userId);
    if (!profile) throw new SajuProfileRequiredError();

    const context = calculateSajuContext(profile, dateKey);
    const result = await getGroqDailyNumber(context);
    const recommendation = await completeDailyRecommendation(
      userId,
      dateKey,
      claim.leaseExpiresAt,
      result,
    );
    if (recommendation) return recommendation;

    const current = await getDailyRecommendation(userId, dateKey);
    if (current) return current;
    throw new DailyRecommendationClaimLostError();
  } catch (error) {
    await releaseDailyRecommendationClaim(
      userId,
      dateKey,
      claim.leaseExpiresAt,
    );
    throw error;
  }
}
