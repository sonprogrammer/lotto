import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { calculateWeeklyAnalysis } from "../lib/calculate-weekly-analysis";
import { AnalysisDashboard } from "./analysis-dashboard";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("@/widgets/site-header", () => ({
  SiteHeader: ({ displayName }: { displayName: string }) => (
    <div>{displayName}</div>
  ),
}));

const analysis = calculateWeeklyAnalysis([
  { roundNumber: 1249, numbers: [2, 11, 16, 25, 34, 35] },
]);

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AnalysisDashboard displayName="손영진" />
    </QueryClientProvider>,
  );
}

beforeEach(() => fetchMock.mockReset());

it("runs analysis only after the user clicks and displays real results", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ analysis, drawCount: 1249, latestRound: 1249 }),
      { status: 200 },
    ),
  );
  renderDashboard();

  expect(screen.queryByText(/회 반영/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(await screen.findByText(/1249회 반영/)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/analysis/run", {
    method: "POST",
  });
});

it("explains the number of consecutive rounds a number has been absent", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ analysis, drawCount: 1249, latestRound: 1249 }),
      { status: 200 },
    ),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  const helpButton = screen.getByRole("button", { name: "미출현 회차 설명" });
  await userEvent.hover(helpButton);

  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "1249회 기준 1회 미출현은 1249회에는 나오지 않고 1248회에는 나왔다는 뜻이에요.",
  );
  expect(screen.getByRole("tooltip")).toHaveTextContent(
    "미출현 횟수가 길어도 다음 회차 당첨 확률이 높아지지는 않아요.",
  );
  await userEvent.click(helpButton);
  expect(helpButton).toHaveAttribute("aria-expanded", "true");
  await userEvent.click(helpButton);
  expect(helpButton).toHaveAttribute("aria-expanded", "false");
});

it("shows a skeleton and prevents duplicate analysis requests while pending", async () => {
  let resolveRequest!: (response: Response) => void;
  fetchMock.mockReturnValue(
    new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    }),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: "분석 중" })).toBeDisabled();
  expect(fetchMock).toHaveBeenCalledOnce();

  resolveRequest(
    new Response(
      JSON.stringify({ analysis, drawCount: 1249, latestRound: 1249 }),
      { status: 200 },
    ),
  );
  expect(await screen.findByText(/1249회 반영/)).toBeInTheDocument();
});

it("shows a retry action when real draw data cannot be loaded", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ error: "분석 자료를 가져오지 못했어요." }), {
      status: 502,
    }),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "분석 자료를 가져오지 못했어요.",
  );
  expect(screen.getByRole("button", { name: "다시 분석하기" })).toBeEnabled();
});
