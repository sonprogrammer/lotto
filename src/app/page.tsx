import { Suspense } from "react";
import { AuthAwarePreview } from "@/features/auth/components/auth-aware-preview";
import { LottoNumberPreview } from "@/features/preview/components/lotto-number-preview";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function Home() {
  const isConfigured = Boolean(getSupabaseConfig());

  return (
    <Suspense
      fallback={
        <LottoNumberPreview isConfigured={isConfigured} isSignedIn={false} />
      }
    >
      <AuthAwarePreview />
    </Suspense>
  );
}
