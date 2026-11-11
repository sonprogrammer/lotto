import { LottoNumberPreview } from "@/features/preview/components/lotto-number-preview";
import { getKakaoConfig, getMongoConfig } from "@/features/auth/server/config";
import { getCurrentUser } from "@/features/auth/server/current-session";

export async function AuthAwarePreview() {
  let isConfigured = false;
  let isSignedIn = false;
  let displayName: string | undefined;

  try {
    getKakaoConfig();
    getMongoConfig();
    isConfigured = true;
    const currentUser = await getCurrentUser();
    isSignedIn = Boolean(currentUser);
    displayName = currentUser?.nickname;
  } catch {
    isConfigured = false;
  }

  return (
    <LottoNumberPreview
      displayName={displayName}
      isConfigured={isConfigured}
      isSignedIn={isSignedIn}
    />
  );
}
