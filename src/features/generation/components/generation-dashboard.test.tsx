import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { GenerationDashboard } from "./generation-dashboard";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
vi.mock("@/widgets/site-header", () => ({ SiteHeader: () => <header /> }));

function renderDashboard() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <GenerationDashboard displayName="손영진" />
    </QueryClientProvider>,
  );
}

const result = {
  combinations: [{ numbers: [1, 9, 18, 27, 36, 45], score: 2.4 }],
  latestRound: 1249,
  period: {
    type: "recent",
    count: 30,
    drawCount: 30,
    firstRound: 1220,
    latestRound: 1249,
  },
  appliedConstraints: { fixedNumbers: [] },
  unsupportedConditions: ["다음 회차 확정"],
  explanation: "과거 출현 빈도를 참고했습니다. 당첨 결과는 예측할 수 없어요.",
  seed: "sample-seed",
};

beforeEach(() => fetchMock.mockReset());

it("submits the default five combinations for the recent 30 draws", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(result), { status: 200 }),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/generation",
    expect.objectContaining({
      body: JSON.stringify({
        fixedNumbers: [],
        count: 5,
        period: { type: "recent", count: 30 },
      }),
    }),
  );
  const results = await screen.findByRole("region", { name: "생성 결과" });
  expect(within(results).getByText("1249회차 기준")).toBeInTheDocument();
  expect(within(results).getByText(result.explanation)).toBeInTheDocument();
  expect(within(results).getByText(/다음 회차 확정/)).toBeInTheDocument();
  expect(
    within(results).getByRole("group", {
      name: "1번 조합: 1, 9, 18, 27, 36, 45",
    }),
  ).toBeInTheDocument();
});

it("allows zero through six fixed numbers and limits six to one combination", async () => {
  renderDashboard();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "조합 생성하기" })).toBeEnabled();
  for (const number of [1, 2, 3, 4, 5, 6]) {
    await userEvent.click(
      screen.getByRole("button", { name: `${number}번 고정` }),
    );
  }
  expect(screen.getByRole("button", { name: "조합 생성하기" })).toBeDisabled();
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "생성 개수" }),
    "1",
  );
  expect(screen.getByRole("button", { name: "조합 생성하기" })).toBeEnabled();
});

it("prevents selecting more than six fixed numbers and allows deselection", async () => {
  renderDashboard();
  expect(screen.getByRole("button", { name: "1번 고정" })).toHaveClass(
    "lotto-ball-gold",
  );
  expect(screen.getByRole("button", { name: "11번 고정" })).toHaveClass(
    "lotto-ball-blue",
  );
  expect(screen.getByRole("button", { name: "21번 고정" })).toHaveClass(
    "lotto-ball-red",
  );
  expect(screen.getByRole("button", { name: "31번 고정" })).toHaveClass(
    "lotto-ball-gray",
  );
  expect(screen.getByRole("button", { name: "41번 고정" })).toHaveClass(
    "lotto-ball-green",
  );
  expect(
    screen.getByText(/의견을 남기지 않으면 기본 분석 프롬프트를 사용/),
  ).toBeInTheDocument();
  for (const number of [1, 2, 3, 4, 5, 6]) {
    await userEvent.click(
      screen.getByRole("button", { name: `${number}번 고정` }),
    );
  }
  expect(screen.getByRole("button", { name: "7번 고정" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "1번 고정" }));
  expect(screen.getByRole("button", { name: "7번 고정" })).toBeEnabled();
});

it("submits selected balls and a trimmed optional prompt in one request", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(result), { status: 200 }),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "9번 고정" }));
  await userEvent.click(screen.getByRole("button", { name: "1번 고정" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: /생성에 참고할 의견/ }),
    " 홀수 3개 ",
  );
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/generation",
    expect.objectContaining({
      body: JSON.stringify({
        fixedNumbers: [1, 9],
        count: 5,
        period: { type: "recent", count: 30 },
        prompt: "홀수 3개",
      }),
    }),
  );
  expect(
    await screen.findByRole("region", { name: "생성 결과" }),
  ).toBeInTheDocument();
});

it("shows a loading skeleton and lets the user retry a failed request", async () => {
  let resolveRequest!: (response: Response) => void;
  fetchMock
    .mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(result), { status: 200 }),
    );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: "생성 중" })).toBeDisabled();
  resolveRequest(
    new Response(JSON.stringify({ error: "AI 사용 한도에 도달했어요." }), {
      status: 429,
    }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "AI 사용 한도에 도달했어요.",
  );
  await userEvent.click(screen.getByRole("button", { name: "다시 시도하기" }));
  expect(
    await screen.findByRole("region", { name: "생성 결과" }),
  ).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
