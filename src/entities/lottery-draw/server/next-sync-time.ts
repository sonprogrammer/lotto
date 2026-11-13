const KOREA_OFFSET_HOURS = 9;
const SCHEDULE_HOUR_KOREA = 21;
const SATURDAY_UTC_DAY = 6;

export function getNextLotterySyncAt(now: Date): Date {
  const koreaNow = new Date(
    now.getTime() + KOREA_OFFSET_HOURS * 60 * 60 * 1000,
  );
  const daysUntilSaturday = (SATURDAY_UTC_DAY - koreaNow.getUTCDay() + 7) % 7;
  const scheduledKoreaDate = new Date(
    Date.UTC(
      koreaNow.getUTCFullYear(),
      koreaNow.getUTCMonth(),
      koreaNow.getUTCDate() + daysUntilSaturday,
      SCHEDULE_HOUR_KOREA - KOREA_OFFSET_HOURS,
    ),
  );

  if (scheduledKoreaDate <= now) {
    scheduledKoreaDate.setUTCDate(scheduledKoreaDate.getUTCDate() + 7);
  }

  return scheduledKoreaDate;
}
