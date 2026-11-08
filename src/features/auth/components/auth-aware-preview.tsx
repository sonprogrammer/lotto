import { LottoNumberPreview } from "@/features/preview/components/lotto-number-preview";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AuthAwarePreview() {
  const isConfigured = Boolean(getSupabaseConfig());

  if (!isConfigured) {
    return <LottoNumberPreview isConfigured={false} isSignedIn={false} />;
  }

  let isSignedIn = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    isSignedIn = Boolean(data?.claims?.sub);
  } catch {
    isSignedIn = false;
  }

  return <LottoNumberPreview isConfigured isSignedIn={isSignedIn} />;
}
