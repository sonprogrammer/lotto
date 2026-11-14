import { describe, expect, it } from "vitest";
import { getGuestDrawCount } from "./guest-draw-quota";

describe("getGuestDrawCount", () => {
  it.each([
    ["0", 0],
    ["1", 1],
    ["3", 3],
    [null, 0],
    ["not-a-count", 0],
    ["-1", 0],
    ["1.5", 0],
    ["4", 3],
    ["9007199254740992", 3],
  ])("normalizes stored count %s to %i", (value, expected) => {
    expect(getGuestDrawCount(value)).toBe(expected);
  });
});
