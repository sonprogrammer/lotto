import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRunsMock, useRunMock, useCreateMock } = vi.hoisted(() => ({
  useRunsMock: vi.fn(),
  useRunMock: vi.fn(),
  useCreateMock: vi.fn(),
}));

vi.mock("@/widgets/site-header", () => ({
  SiteHeader: () => <header>사이트 메뉴</header>,
}));
vi.mock("../hooks/use-simulation-runs", () => ({
  useSimulationRuns: useRunsMock,
}));
vi.mock("../hooks/use-simulation-run", () => ({
  useSimulationRun: useRunMock,
}));
vi.mock("../hooks/use-create-simulation", () => ({
  useCreateSimulation: useCreateMock,
}));

import { SimulationDashboard } from "./simulation-dashboard";
import { SimulationApiError } from "../api/simulation-api";

const runSummary = {
  id: "65ab12cd34ef56ab78cd9001",
  createdAt: "2026-11-14T00:00:00.000Z",
  settings: {
    targetRoundCount: 30 as const,
    analysisDrawCount: 30 as const,
    combinationsPerRound: 5,
    ticketCost: 1_000 as const,
  },
  generatorVersion: "stats-v1" as const,
  baseLatestRound: 100,
  totals: {
    combinationsEvaluated: 150,
    totalCost: 150_000,
    knownPayoutTotal: 5_000,
    unknownPayoutCount: 0,
    netKnownPayout: -145_000,
    hitsByRank: [
      { rank: 1 as const, count: 0 },
      { rank: 2 as const, count: 0 },
      { rank: 3 as const, count: 0 },
      { rank: 4 as const, count: 0 },
      { rank: 5 as const, count: 1 },
    ] as const,
  },
};

const run = {
  ...runSummary,
  rounds: [
    {
      roundNumber: 100,
      drawDate: "2026-11-07T00:00:00.000Z",
      winningNumbers: [1, 2, 3, 4, 5, 6],
      bonusNumber: 7,
      analysisFirstRound: 70,
      analysisLatestRound: 99,
      seed: "historical-simulation:v1:100:5",
      combinations: [
        {
          numbers: [1, 2, 3, 4, 5, 8],
          matchedNumberCount: 5,
          bonusMatched: false,
          rank: 3,
          amountPerWinner: 1_000_000,
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  useRunsMock.mockReturnValue({ data: [], isPending: false, isError: false });
  useRunMock.mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
  });
  useCreateMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  });
});

describe("SimulationDashboard", () => {
  it("shows the default setting and historical-only disclaimer", () => {
    render(<SimulationDashboard displayName="영진" userId="user-1" />);

    expect(screen.getByLabelText("회차당 조합 수")).toHaveValue("5");
    expect(
      screen.getByText(/과거 결과는 미래 당첨을 예측하거나/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "시뮬레이션 실행" }),
    ).toBeInTheDocument();
    expect(screen.getByText("저장된 시뮬레이션이 없어요.")).toBeInTheDocument();
  });

  it("submits the selected combinations per round and prevents duplicate runs", () => {
    const mutate = vi.fn();
    useCreateMock.mockReturnValue({ mutate, isPending: false, isError: false });
    render(<SimulationDashboard displayName="영진" userId="user-1" />);

    fireEvent.change(screen.getByLabelText("회차당 조합 수"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "시뮬레이션 실행" }));

    expect(mutate).toHaveBeenCalledWith(3, expect.any(Object));
  });

  it("shows loading and error states distinctly", () => {
    useRunsMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });
    const { rerender } = render(
      <SimulationDashboard displayName="영진" userId="user-1" />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");

    useRunsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("기록을 불러오지 못했어요."),
      refetch: vi.fn(),
    });
    rerender(<SimulationDashboard displayName="영진" userId="user-1" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "저장된 시뮬레이션을 불러오지 못했어요.",
    );
  });

  it("shows aggregate metrics and per-round generated and winning numbers", () => {
    useRunsMock.mockReturnValue({
      data: [runSummary],
      isPending: false,
      isError: false,
    });
    useRunMock.mockReturnValue({ data: run, isPending: false, isError: false });
    render(<SimulationDashboard displayName="영진" userId="user-1" />);

    expect(screen.getByText("최근 30회차 비교")).toBeInTheDocument();
    expect(screen.getByText("총 구매 비용")).toBeInTheDocument();
    expect(screen.getByText("등수별 당첨 조합")).toBeInTheDocument();
    expect(screen.getByText("100회차 결과")).toBeInTheDocument();
    expect(screen.getByText(/1,000,000원/)).toBeInTheDocument();
    expect(
      screen.getByText(/회차 직전 30회차 전 통계로 생성/),
    ).toBeInTheDocument();
  });

  it("announces when an execution is running", () => {
    useCreateMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
    });
    render(<SimulationDashboard displayName="영진" userId="user-1" />);

    expect(
      screen.getByRole("button", { name: "시뮬레이션 계산 중" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("does not offer a blind retry for non-retryable history errors", () => {
    useCreateMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new SimulationApiError(
        "시뮬레이션하려면 최소 60회차의 당첨 자료가 필요해요.",
        false,
      ),
    });
    render(<SimulationDashboard displayName="영진" userId="user-1" />);

    expect(screen.queryByRole("button", { name: "다시 시도하기" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "회차별 당첨 내역 확인" }),
    ).toHaveAttribute("href", "/history");
  });

  it("announces when a simulation result has been saved", () => {
    useCreateMock.mockReturnValue({
      mutate: vi.fn(),
      data: run,
      isPending: false,
      isError: false,
      isSuccess: true,
    });
    render(<SimulationDashboard displayName="영진" userId="user-1" />);

    expect(screen.getByRole("status")).toHaveTextContent("결과를 저장했어요");
  });

  it("keeps a newly saved result visible if refreshing the run list fails", () => {
    useRunsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("list refresh failed"),
      refetch: vi.fn(),
    });
    useRunMock.mockReturnValue({ data: run, isPending: false, isError: false });
    useCreateMock.mockReturnValue({
      mutate: (
        _count: number,
        options: { onSuccess: (result: typeof run) => void },
      ) => options.onSuccess(run),
      isPending: false,
      isError: false,
    });

    render(<SimulationDashboard displayName="영진" userId="user-1" />);
    fireEvent.click(screen.getByRole("button", { name: "시뮬레이션 실행" }));

    expect(screen.getByText("최근 30회차 비교")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "저장된 시뮬레이션을 불러오지 못했어요.",
    );
  });
});
