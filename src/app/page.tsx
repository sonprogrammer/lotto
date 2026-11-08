import { Suspense } from "react";
import { AuthAwarePreview } from "@/features/auth/components/auth-aware-preview";
import { LottoNumberPreview } from "@/features/preview/components/lotto-number-preview";

export default function Home() {
  return (
    <Suspense
      fallback={<LottoNumberPreview isConfigured={false} isSignedIn={false} />}
    >
      <AuthAwarePreview />
    </Suspense>
  );
}
