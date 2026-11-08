import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase 환경 설정이 필요합니다.");
  }

  return createBrowserClient(config.url, config.publishableKey);
}
