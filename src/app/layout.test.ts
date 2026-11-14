import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("resolves Open Graph image URLs through the stable production domain", async () => {
  vi.stubEnv("VERCEL_URL", "deployment-protected.vercel.app");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "lotto-amber.vercel.app");
  vi.resetModules();

  const { metadata } = await import("./layout");

  expect(new URL(String(metadata.metadataBase)).hostname).toBe(
    "lotto-amber.vercel.app",
  );
});
