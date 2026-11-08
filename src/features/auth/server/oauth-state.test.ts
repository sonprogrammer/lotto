import { describe, expect, it } from "vitest";
import { createOAuthState, isOAuthStateValid } from "./oauth-state";

describe("OAuth state", () => {
  it("creates an unpredictable URL-safe value", () => {
    const first = createOAuthState();
    const second = createOAuthState();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
  });

  it("accepts only a non-empty exact match", () => {
    expect(isOAuthStateValid("same", "same")).toBe(true);
    expect(isOAuthStateValid("same", "other")).toBe(false);
    expect(isOAuthStateValid("", "")).toBe(false);
    expect(isOAuthStateValid(undefined, "same")).toBe(false);
  });
});
