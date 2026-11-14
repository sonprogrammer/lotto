import { calculateFourPillars } from "manseryeok";
import type { SajuProfile } from "@/entities/user";
import {
  SajuAiContextSchema,
  type SajuAiContext,
} from "../model/daily-saju-input";

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Invalid saju date");
  return { year, month, day };
}

export function calculateSajuContext(
  profile: SajuProfile,
  today: string,
): SajuAiContext {
  const birthDate = parseDate(profile.birthDate);
  const [birthHour, birthMinute] = profile.birthTime
    ? profile.birthTime.split(":").map(Number)
    : [12, 0];
  const birthPillars = calculateFourPillars({
    ...birthDate,
    hour: birthHour,
    minute: birthMinute,
    ...(profile.calendarType === "lunar" && {
      isLunar: true,
      isLeapMonth: profile.isLeapMonth ?? false,
    }),
    dayBoundary: "midnight",
  }).toObject();

  const todayPillars = calculateFourPillars({
    ...parseDate(today),
    hour: 12,
    minute: 0,
    dayBoundary: "midnight",
  }).toObject();

  return SajuAiContextSchema.parse({
    birthPillars: {
      year: birthPillars.year,
      month: birthPillars.month,
      day: birthPillars.day,
      ...(profile.birthTime && { hour: birthPillars.hour }),
    },
    today: { dateKey: today, dayPillar: todayPillars.day },
  });
}
