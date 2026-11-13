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

const period = {
  type: "recent" as const,
  count: 30,
  drawCount: 1,
  firstRound: 1249,
  latestRound: 1249,
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AnalysisDashboard
        displayName="손영진"
        userId="65ab12cd34ef56ab78cd90ef"
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => fetchMock.mockReset());

it("runs analysis only after the user clicks and displays real results", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ analysis, period, availableDrawCount: 1249 }),
      { status: 200 },
    ),
  );
  renderDashboard();

  expect(screen.queryByText(/회 반영/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(await screen.findByText(/1회 반영/)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/analysis/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ period: { type: "recent", count: 30 } }),
  });
});

it("lets the user select a custom period and reports the returned range", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        analysis,
        period: { ...period, count: 7 },
        availableDrawCount: 1249,
      }),
      { status: 200 },
    ),
  );
  renderDashboard();

  const selector = screen.getByRole("combobox", { name: "분석 기간" });
  expect(selector).toHaveValue("recent:30");
  expect(screen.getByRole("option", { name: "전체" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "최근 10회" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "최근 15회" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "최근 20회" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "최근 30회" })).toBeInTheDocument();
  await userEvent.selectOptions(selector, "custom");
  const customInput = screen.getByRole("spinbutton", {
    name: "직접 입력 회차",
  });
  await userEvent.clear(customInput);
  await userEvent.type(customInput, "7");
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(fetchMock).toHaveBeenCalledWith("/api/analysis/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ period: { type: "recent", count: 7 } }),
  });
  const resultRange = await screen.findByText(
    (_, element) => element?.classList.contains("analysis-meta") ?? false,
  );
  expect(resultRange).toHaveTextContent("최근 7회");
  expect(resultRange).toHaveTextContent("1249회부터");
  expect(resultRange).toHaveTextContent("1249회까지");
  expect(resultRange).toHaveTextContent("1회 반영");
  expect(resultRange).toHaveTextContent("1249회차 기준");
});

it("clears results when the selected period changes", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ analysis, period, availableDrawCount: 1249 }),
      { status: 200 },
    ),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));
  expect(
    await screen.findByText(
      (_, element) => element?.classList.contains("analysis-meta") ?? false,
    ),
  ).toHaveTextContent("최근 30회");

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "분석 기간" }),
    "recent:10",
  );

  expect(
    screen.queryByText(
      (_, element) => element?.classList.contains("analysis-meta") ?? false,
    ),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("선택한 기간으로 분석을 실행해 결과를 확인해 주세요."),
  ).toBeInTheDocument();
});

it("reuses a fresh browser-cached analysis when returning to a prior period", async () => {
  fetchMock
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ analysis, period, availableDrawCount: 1249 }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          analysis,
          period: { ...period, count: 20 },
          availableDrawCount: 1249,
        }),
        { status: 200 },
      ),
    );
  renderDashboard();

  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));
  await screen.findByText(/1249회차 기준/);
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "분석 기간" }),
    "recent:20",
  );
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));
  await screen.findByText(
    (_, element) => element?.classList.contains("analysis-meta") ?? false,
  );
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "분석 기간" }),
    "recent:30",
  );
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(
    screen.getByText(
      (_, element) => element?.classList.contains("analysis-meta") ?? false,
    ),
  ).toHaveTextContent("최근 30회");
});

it("requires a positive integer before running a custom period", async () => {
  renderDashboard();
  const selector = screen.getByRole("combobox", { name: "분석 기간" });
  await userEvent.selectOptions(selector, "custom");

  const customInput = screen.getByRole("spinbutton", {
    name: "직접 입력 회차",
  });
  const runButton = screen.getByRole("button", { name: "분석하기" });
  expect(runButton).toBeDisabled();
  await userEvent.type(customInput, "0");
  expect(runButton).toBeDisabled();
  await userEvent.clear(customInput);
  await userEvent.type(customInput, "3");
  expect(runButton).toBeEnabled();
});

it("limits a custom period to the number of draws already reported by the server", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ analysis, period, availableDrawCount: 1249 }),
      { status: 200 },
    ),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));
  await screen.findByText(/1회 반영/);
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "분석 기간" }),
    "custom",
  );
  const customInput = screen.getByRole("spinbutton", {
    name: "직접 입력 회차",
  });
  await userEvent.type(customInput, "1250");

  expect(customInput).toHaveAttribute("max", "1249");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "보유한 1249회 이내로 입력해 주세요.",
  );
  expect(screen.getByRole("button", { name: "분석하기" })).toBeDisabled();
});

it("uses an explicit selected-period message when a number did not appear", async () => {
  const periodWithoutAppearance = { ...period, drawCount: 2, firstRound: 1248 };
  const numberWithNoAppearance = {
    ...analysis,
    numberFrequencies: analysis.numberFrequencies.map((item) => ({
      ...item,
      count: 0,
      drawsSinceLastAppearance: null,
    })),
  };
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        analysis: numberWithNoAppearance,
        period: periodWithoutAppearance,
        availableDrawCount: 1249,
      }),
      { status: 200 },
    ),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(await screen.findAllByText("최근 30회 내 미출현")).toHaveLength(45);
  expect(screen.queryByText("기록 없음")).not.toBeInTheDocument();
});

it("explains the number of consecutive rounds a number has been absent", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ analysis, period, availableDrawCount: 1249 }),
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
      JSON.stringify({ analysis, period, availableDrawCount: 1249 }),
      { status: 200 },
    ),
  );
  expect(await screen.findByText(/1회 반영/)).toBeInTheDocument();
});

it("shows a retry action when real draw data cannot be loaded", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ error: "최근 회차 수보다 큰 기간은 선택할 수 없어요." }),
      { status: 400 },
    ),
  );
  renderDashboard();
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "분석 기간" }),
    "recent:20",
  );
  await userEvent.click(screen.getByRole("button", { name: "분석하기" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "최근 회차 수보다 큰 기간은 선택할 수 없어요.",
  );
  expect(screen.getByRole("button", { name: "다시 분석하기" })).toBeEnabled();
  expect(screen.getByRole("combobox", { name: "분석 기간" })).toHaveValue(
    "recent:20",
  );
});
