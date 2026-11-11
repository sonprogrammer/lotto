import { expect, it } from "vitest";
import { parseLotteryDrawSourceResponse } from "./source-response";

const sourceDraw = {
  ltEpsd: 1249,
  ltRflYmd: "20261107",
  tm1WnNo: 2,
  tm2WnNo: 11,
  tm3WnNo: 16,
  tm4WnNo: 25,
  tm5WnNo: 34,
  tm6WnNo: 35,
  bnsWnNo: 14,
  rnk1WnNope: 14,
  rnk1WnAmt: 2025045509,
  rnk2WnNope: 93,
  rnk2WnAmt: 50807594,
  rnk3WnNope: 3550,
  rnk3WnAmt: 1331016,
  rnk4WnNope: 162101,
  rnk4WnAmt: 50000,
  rnk5WnNope: 2634961,
  rnk5WnAmt: 5000,
};

it("maps the source response into validated lottery draw documents", () => {
  expect(
    parseLotteryDrawSourceResponse({ data: { list: [sourceDraw] } }),
  ).toEqual([
    {
      roundNumber: 1249,
      drawDate: new Date("2026-11-07T00:00:00.000Z"),
      numbers: [2, 11, 16, 25, 34, 35],
      bonusNumber: 14,
      prizesByRank: [
        { rank: 1, winnerCount: 14, amountPerWinner: 2025045509 },
        { rank: 2, winnerCount: 93, amountPerWinner: 50807594 },
        { rank: 3, winnerCount: 3550, amountPerWinner: 1331016 },
        { rank: 4, winnerCount: 162101, amountPerWinner: 50000 },
        { rank: 5, winnerCount: 2634961, amountPerWinner: 5000 },
      ],
    },
  ]);
});

it("rejects incomplete or duplicate draw rows", () => {
  expect(() =>
    parseLotteryDrawSourceResponse({
      data: { list: [{ ...sourceDraw, tm6WnNo: 34 }] },
    }),
  ).toThrow();
  expect(() =>
    parseLotteryDrawSourceResponse({ data: { list: [] } }),
  ).toThrow();
  expect(() =>
    parseLotteryDrawSourceResponse({
      data: { list: [sourceDraw, sourceDraw] },
    }),
  ).toThrow("duplicate rounds");
});
