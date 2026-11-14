import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("uses the fixed public domain regardless of deployment host environment variables", async () => {
  vi.stubEnv("VERCEL_URL", "deployment-protected.vercel.app");
  vi.stubEnv(
    "VERCEL_PROJECT_PRODUCTION_URL",
    "unexpected-production-host.vercel.app",
  );
  vi.resetModules();

  const { metadata } = await import("./layout");

  expect(new URL(String(metadata.metadataBase)).hostname).toBe(
    "lotto-amber.vercel.app",
  );
});
