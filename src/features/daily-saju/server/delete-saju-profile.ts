import { deleteDailyRecommendations } from "@/entities/daily-saju/server/daily-saju-store";
import { removeSajuProfile } from "@/entities/user/server/saju-profile-store";

export class SajuProfileNotFoundError extends Error {
  constructor() {
    super("Saju profile owner not found");
    this.name = "SajuProfileNotFoundError";
  }
}

export async function deleteSajuProfile(userId: string): Promise<void> {
  const removed = await removeSajuProfile(userId);
  if (!removed) throw new SajuProfileNotFoundError();
  await deleteDailyRecommendations(userId);
}
