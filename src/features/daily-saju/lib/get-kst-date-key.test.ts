import { describe, expect, it } from "vitest";
import { getKstDateKey } from "./get-kst-date-key";

describe("getKstDateKey", () => {
  it("returns the Korean date before UTC reaches the next day", () => {
    expect(getKstDateKey(new Date("2026-11-14T14:59:59.999Z"))).toBe(
      "2026-11-14",
    );
  });

  it("advances at midnight in Korea rather than midnight UTC", () => {
    expect(getKstDateKey(new Date("2026-11-14T15:00:00.000Z"))).toBe(
      "2026-11-15",
    );
  });
});
