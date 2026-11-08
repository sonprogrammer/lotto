import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "./config";

describe("getSupabaseConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the project URL and publishable key when both are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://lotto-demo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_demo");

    expect(getSupabaseConfig()).toEqual({
      url: "https://lotto-demo.supabase.co",
      publishableKey: "sb_publishable_demo",
    });
  });

  it("returns null when a required project value is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://lotto-demo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(getSupabaseConfig()).toBeNull();
  });

  it("treats the committed scaffold placeholders as unconfigured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://your-project.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "replace-with-your-publishable-key",
    );

    expect(getSupabaseConfig()).toBeNull();
  });

  it("rejects malformed non-http project URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "javascript:alert(1)");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_demo");

    expect(getSupabaseConfig()).toBeNull();
  });
});
