import { isValidElement } from "react";
import { expect, it, vi } from "vitest";
vi.mock("@/features/analysis/components/lottery-draw-history", () => ({
  LotteryDrawHistory: () => null,
}));

import HistoryPage from "./page";

it("renders the draw history without repeating page-level auth", () => {
  expect(isValidElement(HistoryPage())).toBe(true);
});
