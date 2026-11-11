import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { calculateWeeklyAnalysis } from "../lib/calculate-weekly-analysis";
import { AnalysisDashboard } from "./analysis-dashboard";

vi.mock("@/widgets/site-header", () => ({
  SiteHeader: ({ displayName }: { displayName: string }) => (
    <div>{displayName}</div>
  ),
}));

describe("AnalysisDashboard", () => {
  it("shows the analysis and signed-in user's nickname", () => {
    const analysis = calculateWeeklyAnalysis([
      { roundNumber: 100, numbers: [1, 2, 3, 11, 23, 45] },
    ]);

    render(
      <AnalysisDashboard
        analysis={analysis}
        displayName="손영진"
        state="ready"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "이번 주 분석" }),
    ).toBeInTheDocument();
    expect(screen.getByText("손영진")).toBeInTheDocument();
    expect(screen.getByText(/100회차 기준/)).toBeInTheDocument();
    expect(
      screen.getByText("번호별 출현 횟수와 미출현 회차"),
    ).toBeInTheDocument();
    expect(screen.getByText("저수 1–22 · 고수 23–45")).toBeInTheDocument();
    expect(
      screen.getByText(/당첨을 예측하거나 보장하지 않아요/),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no stored draws", () => {
    render(
      <AnalysisDashboard
        analysis={calculateWeeklyAnalysis([])}
        displayName="손영진"
        state="ready"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "아직 분석할 당첨 번호 자료가 없어요.",
    );
  });

  it("shows an error state when draw data cannot be loaded", () => {
    render(
      <AnalysisDashboard analysis={null} displayName="손영진" state="error" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "분석 자료를 불러오지 못했어요.",
    );
  });
});
