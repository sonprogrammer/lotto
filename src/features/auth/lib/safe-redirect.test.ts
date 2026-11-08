import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "./safe-redirect";

describe("getSafeRedirectPath", () => {
  it("preserves a same-site relative destination", () => {
    expect(getSafeRedirectPath("/analysis?view=weekly#summary")).toBe(
      "/analysis?view=weekly#summary",
    );
  });

  it.each([
    "https://example.com/account",
    "//example.com/account",
    "\\\\example.com\\account",
    "javascript:alert(1)",
  ])("falls back to home for unsafe destination %s", (destination) => {
    expect(getSafeRedirectPath(destination)).toBe("/");
  });

  it("uses home when no destination is supplied", () => {
    expect(getSafeRedirectPath(null)).toBe("/");
  });
});
