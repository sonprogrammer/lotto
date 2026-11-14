import { describe, expect, it } from "vitest";
import type { SajuProfile } from "@/entities/user";
import { calculateSajuContext } from "./calculate-saju-context";

const timestamps = {
  createdAt: new Date("2026-11-14T00:00:00.000Z"),
  updatedAt: new Date("2026-11-14T00:00:00.000Z"),
};

function profile(overrides: Partial<SajuProfile> = {}): SajuProfile {
  return {
    birthDate: "1992-10-24",
    calendarType: "solar",
    ...timestamps,
    ...overrides,
  };
}

describe("calculateSajuContext", () => {
  it("returns all birth pillars and today's day pillar for a known birth time", () => {
    expect(
      calculateSajuContext(profile({ birthTime: "05:30" }), "2024-03-10"),
    ).toEqual({
      birthPillars: {
        year: "임신",
        month: "경술",
        day: "계유",
        hour: "을묘",
      },
      today: { dateKey: "2024-03-10", dayPillar: "계유" },
    });
  });

  it("omits the hour pillar when the birth time is unknown", () => {
    const result = calculateSajuContext(profile(), "2024-03-10");

    expect(result.birthPillars).toEqual({
      year: "임신",
      month: "경술",
      day: "계유",
    });
    expect(result.birthPillars).not.toHaveProperty("hour");
  });

  it("uses the lunar leap-month flag when calculating a lunar profile", () => {
    const result = calculateSajuContext(
      profile({
        birthDate: "1992-09-29",
        calendarType: "lunar",
        isLeapMonth: false,
        birthTime: "05:30",
      }),
      "2024-03-10",
    );

    expect(result.birthPillars).toHaveProperty("year");
    expect(result.birthPillars.hour).toBeDefined();
  });
});
