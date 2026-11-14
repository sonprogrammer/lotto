import { describe, expect, it } from "vitest";
import { SajuAiContextSchema } from "./daily-saju-input";

describe("SajuAiContextSchema", () => {
  it("accepts a context without an unknown birth hour pillar", () => {
    expect(
      SajuAiContextSchema.safeParse({
        birthPillars: {
          year: "임신",
          month: "경술",
          day: "계유",
        },
        today: { dateKey: "2024-03-10", dayPillar: "계유" },
      }).success,
    ).toBe(true);
  });

  it("accepts a four-pillar context when the birth time is known", () => {
    expect(
      SajuAiContextSchema.safeParse({
        birthPillars: {
          year: "임신",
          month: "경술",
          day: "계유",
          hour: "을묘",
        },
        today: { dateKey: "2024-03-10", dayPillar: "계유" },
      }).success,
    ).toBe(true);
  });

  it("rejects raw birth details or account identifiers", () => {
    expect(
      SajuAiContextSchema.safeParse({
        birthPillars: {
          year: "임신",
          month: "경술",
          day: "계유",
        },
        today: { dateKey: "2024-03-10", dayPillar: "계유" },
        birthDate: "1992-10-24",
        userId: "65ab12cd34ef56ab78cd90ef",
      }).success,
    ).toBe(false);
  });
});
