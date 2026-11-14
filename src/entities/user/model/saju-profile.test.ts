import { describe, expect, it } from "vitest";
import { SajuProfileInputSchema, SajuProfileSchema } from "./saju-profile";

describe("SajuProfileInputSchema", () => {
  it("accepts a solar profile without optional name or birth time", () => {
    expect(
      SajuProfileInputSchema.safeParse({
        birthDate: "1980-05-12",
        calendarType: "solar",
      }).success,
    ).toBe(true);
  });

  it("accepts a lunar profile with leap month and birth time", () => {
    expect(
      SajuProfileInputSchema.safeParse({
        displayName: "아빠",
        birthDate: "1980-04-12",
        calendarType: "lunar",
        isLeapMonth: true,
        birthTime: "08:30",
      }).success,
    ).toBe(true);
  });

  it("rejects a leap month for a solar date", () => {
    expect(
      SajuProfileInputSchema.safeParse({
        birthDate: "1980-05-12",
        calendarType: "solar",
        isLeapMonth: true,
      }).success,
    ).toBe(false);
  });

  it.each([
    { birthDate: "1980-02-30", calendarType: "solar" },
    { birthDate: "1980-05-12", calendarType: "solar", birthTime: "24:00" },
    { birthDate: "1980-05-12", calendarType: "solar", displayName: "   " },
  ])("rejects invalid profile input", (input) => {
    expect(SajuProfileInputSchema.safeParse(input).success).toBe(false);
  });
});

describe("SajuProfileSchema", () => {
  it("accepts a stored profile with timestamps", () => {
    expect(
      SajuProfileSchema.safeParse({
        birthDate: "1980-05-12",
        calendarType: "solar",
        createdAt: new Date("2026-11-14T00:00:00.000Z"),
        updatedAt: new Date("2026-11-14T00:00:00.000Z"),
      }).success,
    ).toBe(true);
  });

  it("rejects an updated timestamp before the creation timestamp", () => {
    expect(
      SajuProfileSchema.safeParse({
        birthDate: "1980-05-12",
        calendarType: "solar",
        createdAt: new Date("2026-11-14T00:00:00.000Z"),
        updatedAt: new Date("2026-11-13T23:59:59.999Z"),
      }).success,
    ).toBe(false);
  });
});
