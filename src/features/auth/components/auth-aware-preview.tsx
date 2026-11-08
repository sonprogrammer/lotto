import { LottoNumberPreview } from "@/features/preview/components/lotto-number-preview";
import { getKakaoConfig, getMongoConfig } from "@/features/auth/server/config";
import { getCurrentUser } from "@/features/auth/server/current-session";

export async function AuthAwarePreview() {
  let isConfigured = false;
  let isSignedIn = false;

  try {
    getKakaoConfig();
    getMongoConfig();
    isConfigured = true;
    isSignedIn = Boolean(await getCurrentUser());
  } catch {
    isConfigured = false;
  }

  return (
    <LottoNumberPreview isConfigured={isConfigured} isSignedIn={isSignedIn} />
  );
}
