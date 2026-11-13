import { expect, it } from "vitest";
import { getNextLotterySyncAt } from "./next-sync-time";

it.each([
  ["2026-11-13T10:00:00.000Z", "2026-11-14T12:00:00.000Z"],
  ["2026-11-14T11:59:00.000Z", "2026-11-14T12:00:00.000Z"],
  ["2026-11-14T12:00:00.000Z", "2026-11-21T12:00:00.000Z"],
  ["2026-11-14T12:01:00.000Z", "2026-11-21T12:00:00.000Z"],
  ["2026-11-15T02:00:00.000Z", "2026-11-21T12:00:00.000Z"],
])("gets the next KST Saturday 21:00 after %s", (input, expected) => {
  expect(getNextLotterySyncAt(new Date(input)).toISOString()).toBe(expected);
});
