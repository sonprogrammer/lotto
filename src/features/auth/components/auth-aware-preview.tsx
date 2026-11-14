import { LottoNumberPreview } from "@/features/preview/components/lotto-number-preview";
import { getKakaoConfig, getMongoConfig } from "@/features/auth/server/config";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { getKstDateKey } from "@/features/daily-saju/lib/get-kst-date-key";
import { DailySajuHome } from "@/features/daily-saju";

export async function AuthAwarePreview() {
  let isConfigured = false;
  let isSignedIn = false;
  let displayName: string | undefined;
  let userId: string | undefined;

  try {
    getKakaoConfig();
    getMongoConfig();
    isConfigured = true;
    const currentUser = await getCurrentUser();
    isSignedIn = Boolean(currentUser);
    displayName = currentUser?.nickname ?? undefined;
    userId = currentUser?.userId;
  } catch {
    isConfigured = false;
  }

  if (isSignedIn && userId) {
    return (
      <DailySajuHome
        displayName={displayName}
        userId={userId}
        dateKey={getKstDateKey(new Date())}
        isConfigured={isConfigured}
      />
    );
  }

  return (
    <LottoNumberPreview
      displayName={displayName}
      userId={userId}
      isConfigured={isConfigured}
      isSignedIn={isSignedIn}
    />
  );
}
