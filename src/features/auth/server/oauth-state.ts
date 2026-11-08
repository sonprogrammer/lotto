import { randomBytes, timingSafeEqual } from "node:crypto";

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function isOAuthStateValid(
  cookieState: string | undefined,
  responseState: string | null,
): boolean {
  if (!cookieState || !responseState) return false;
  const expected = Buffer.from(cookieState);
  const actual = Buffer.from(responseState);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
