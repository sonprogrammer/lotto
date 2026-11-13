import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { NotificationInbox } from "./notification-inbox";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function renderInbox() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotificationInbox userId="65ab12cd34ef56ab78cd90ef" />
    </QueryClientProvider>,
  );
}

beforeEach(() => fetchMock.mockReset());

it("shows a loading skeleton before the user's inbox arrives", async () => {
  fetchMock.mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve(
              new Response(
                JSON.stringify({
                  items: [],
                  page: 1,
                  pageSize: 20,
                  total: 0,
                  totalPages: 1,
                }),
              ),
            ),
          80,
        ),
      ),
  );
  renderInbox();
  expect(screen.getByLabelText("알림 불러오는 중")).toBeInTheDocument();
  expect(
    await screen.findByText("아직 도착한 알림이 없어요."),
  ).toBeInTheDocument();
});

it("distinguishes an empty inbox from a loading or error state", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
      }),
    ),
  );
  renderInbox();
  expect(
    await screen.findByText("아직 도착한 알림이 없어요."),
  ).toBeInTheDocument();
});

it("shows ranked and corrected notices with the saved-combination deep link", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [
          {
            id: "notice-1",
            savedCombinationId: "combo-1",
            roundNumber: 1250,
            drawDate: "2026-11-07T00:00:00.000Z",
            status: "won",
            rank: 4,
            amountPerWinner: 50_000,
            readAt: null,
          },
          {
            id: "notice-2",
            savedCombinationId: "combo-2",
            roundNumber: 1249,
            drawDate: "2026-10-31T00:00:00.000Z",
            status: "corrected",
            rank: null,
            amountPerWinner: 0,
            readAt: "2026-11-01T00:00:00.000Z",
          },
        ],
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      }),
    ),
  );
  renderInbox();
  expect(await screen.findByText("1250회차 4등 당첨")).toBeInTheDocument();
  expect(screen.getByText("당첨 결과가 정정됐어요")).toBeInTheDocument();
  expect(
    screen.getAllByRole("link", { name: "저장 조합 보기" })[0],
  ).toHaveAttribute("href", "/saved?combinationId=combo-1");
});
