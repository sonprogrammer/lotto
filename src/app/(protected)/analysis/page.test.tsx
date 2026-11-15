import { isValidElement } from "react";
import { expect, it, vi } from "vitest";
vi.mock("@/features/analysis/components/analysis-dashboard", () => ({
  AnalysisDashboard: () => null,
}));

import AnalysisPage from "./page";

it("renders the analysis dashboard without repeating page-level auth", () => {
  expect(isValidElement(AnalysisPage())).toBe(true);
});
