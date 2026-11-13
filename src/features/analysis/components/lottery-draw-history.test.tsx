import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { LotteryDrawHistory } from "./lottery-draw-history";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("@/widgets/site-header", () => ({
  SiteHeader: () => <header>헤더</header>,
}));

const draw = {
  roundNumber: 1249,
  drawDate: "2026-11-07T00:00:00.000Z",
  numbers: [2, 11, 16, 25, 34, 35],
  bonusNumber: 14,
  prizesByRank: [
    { rank: 1, winnerCount: 14, amountPerWinner: 2025045509 },
    { rank: 2, winnerCount: 93, amountPerWinner: 50807594 },
  ],
};

function renderHistory() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LotteryDrawHistory
        displayName="손영진"
        userId="65ab12cd34ef56ab78cd90ef"
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => fetchMock.mockReset());

it("shows a skeleton while loading and then lists real round details", async () => {
  let resolveRequest!: (response: Response) => void;
  fetchMock.mockReturnValue(
    new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    }),
  );
  renderHistory();

  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  resolveRequest(
    new Response(JSON.stringify({ draws: [draw], nextCursor: null }), {
      status: 200,
    }),
  );

  expect(await screen.findByRole("heading", { name: "1249회" })).toBeVisible();
  expect(screen.getByText("2026년 11월 7일")).toBeInTheDocument();
  expect(screen.getByText("보너스 14")).toBeInTheDocument();
  expect(screen.getByText("2,025,045,509원")).toBeInTheDocument();
});

it("loads older rounds when requested", async () => {
  fetchMock
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ draws: [draw], nextCursor: 1249 }), {
        status: 200,
      }),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          draws: [{ ...draw, roundNumber: 1248 }],
          nextCursor: null,
        }),
        { status: 200 },
      ),
    );
  renderHistory();
  await screen.findByRole("heading", { name: "1249회" });
  await userEvent.click(
    screen.getByRole("button", { name: "이전 회차 더 보기" }),
  );

  expect(await screen.findByRole("heading", { name: "1248회" })).toBeVisible();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("shows an error and a retry action when the history request fails", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ error: "failed" }), { status: 500 }),
  );
  renderHistory();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "당첨 내역을 불러오지 못했어요.",
  );
  expect(screen.getByRole("button", { name: "다시 불러오기" })).toBeEnabled();
});

it("offers recovery when loading an older page fails", async () => {
  fetchMock
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ draws: [draw], nextCursor: 1249 }), {
        status: 200,
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "failed" }), { status: 500 }),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          draws: [{ ...draw, roundNumber: 1248 }],
          nextCursor: null,
        }),
        { status: 200 },
      ),
    );
  renderHistory();
  await screen.findByRole("heading", { name: "1249회" });
  await userEvent.click(
    screen.getByRole("button", { name: "이전 회차 더 보기" }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "이전 회차를 불러오지 못했어요.",
  );
  await userEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
  expect(await screen.findByRole("heading", { name: "1248회" })).toBeVisible();
});
