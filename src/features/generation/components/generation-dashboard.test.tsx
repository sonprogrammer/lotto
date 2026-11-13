import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { GenerationDashboard } from "./generation-dashboard";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
vi.mock("@/widgets/site-header", () => ({ SiteHeader: () => <header /> }));
const { useSavedPromptsMock } = vi.hoisted(() => ({
  useSavedPromptsMock: vi.fn(),
}));
vi.mock("@/features/saved-prompt/hooks/use-saved-prompts", () => ({
  useSavedPrompts: useSavedPromptsMock,
}));

function renderDashboard() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <GenerationDashboard
        displayName="손영진"
        userId="65ab12cd34ef56ab78cd90ef"
      />
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
  statisticsSummary: {
    mostFrequentNumbers: [{ number: 9, count: 8 }],
    longestCurrentAbsences: [{ number: 45, drawsSinceLastAppearance: 12 }],
  },
  seed: "sample-seed",
};

beforeEach(() => {
  fetchMock.mockReset();
  useSavedPromptsMock.mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
});

it("uses the selected saved prompt content for generation", async () => {
  useSavedPromptsMock.mockReturnValue({
    data: [
      {
        id: "65ab12cd34ef56ab78cd9001",
        title: "균형 조합",
        content: "홀짝을 3개씩 맞춰주세요.",
        sortOrder: 0,
        createdAt: "2026-11-08T00:00:00.000Z",
        updatedAt: "2026-11-08T00:00:00.000Z",
      },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  fetchMock.mockResolvedValue(new Response(JSON.stringify(result)));
  renderDashboard();

  await userEvent.click(screen.getByRole("button", { name: "저장 프롬프트" }));
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "저장 프롬프트 선택" }),
    "65ab12cd34ef56ab78cd9001",
  );
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));

  const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
  expect(request.prompt).toBe("홀짝을 3개씩 맞춰주세요.");
});

it("keeps prompt management out of the generation form", () => {
  renderDashboard();

  expect(
    screen.queryByRole("button", { name: "프롬프트 관리" }),
  ).not.toBeInTheDocument();
});

it("keeps a new opinion separate from any saved prompt", async () => {
  useSavedPromptsMock.mockReturnValue({
    data: [
      {
        id: "65ab12cd34ef56ab78cd9001",
        title: "균형 조합",
        content: "저장된 의견",
        sortOrder: 0,
        createdAt: "2026-11-08T00:00:00.000Z",
        updatedAt: "2026-11-08T00:00:00.000Z",
      },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  fetchMock.mockResolvedValue(new Response(JSON.stringify(result)));
  renderDashboard();

  await userEvent.click(screen.getByRole("button", { name: "저장 프롬프트" }));
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "저장 프롬프트 선택" }),
    "65ab12cd34ef56ab78cd9001",
  );
  await userEvent.click(screen.getByRole("button", { name: "새 의견" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: /새 의견 입력/ }),
    "연속수는 피해주세요.",
  );
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));

  const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
  expect(request.prompt).toBe("연속수는 피해주세요.");
});

it("keeps all controls locked until the pending generation settles", async () => {
  let resolveRequest!: (response: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    }),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "새 의견" }));
  const count = screen.getByRole("combobox", { name: "생성 개수" });
  const period = screen.getByRole("combobox", { name: "분석 기간" });
  const prompt = screen.getByRole("textbox", { name: /새 의견 입력/ });
  await userEvent.selectOptions(period, "custom");
  const custom = screen.getByRole("spinbutton", { name: "직접 입력 회차" });
  await userEvent.type(custom, "12");
  await userEvent.type(prompt, "홀수 3개");
  await userEvent.click(screen.getByRole("button", { name: "1번 고정" }));
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));

  for (const number of Array.from({ length: 45 }, (_, index) => index + 1)) {
    expect(
      screen.getByRole("button", { name: `${number}번 고정` }),
    ).toBeDisabled();
  }
  for (const control of [count, period, custom, prompt])
    expect(control).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "1번 고정" }));
  await userEvent.selectOptions(count, "1");
  await userEvent.selectOptions(period, "all");
  await userEvent.type(custom, "3");
  await userEvent.type(prompt, "추가 의견");
  // Even a directly dispatched change must not reset a request in flight.
  fireEvent.change(count, { target: { value: "1" } });
  fireEvent.change(period, { target: { value: "all" } });
  fireEvent.change(custom, { target: { value: "3" } });
  fireEvent.change(prompt, { target: { value: "추가 의견" } });
  expect(count).toHaveValue("5");
  expect(period).toHaveValue("custom");
  expect(custom).toHaveValue(12);
  expect(prompt).toHaveValue("홀수 3개");
  expect(screen.getByRole("button", { name: "1번 고정" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  await userEvent.click(screen.getByRole("button", { name: "생성 중" }));
  fireEvent.submit(count.closest("form")!);
  expect(fetchMock).toHaveBeenCalledTimes(1);

  resolveRequest(new Response(JSON.stringify(result), { status: 200 }));
  await screen.findByRole("region", { name: "생성 결과" });
  for (const control of [count, period, custom, prompt])
    expect(control).toBeEnabled();
  expect(screen.getByRole("button", { name: "조합 생성하기" })).toBeEnabled();
});

it("renders deterministic frequency and absence statistics separately from AI prose", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(result), { status: 200 }),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));
  const statistics = await screen.findByRole("region", {
    name: "분석 통계 요약",
  });
  expect(within(statistics).getByText("9번 · 8회 출현")).toBeInTheDocument();
  expect(
    within(statistics).getByText("45번 · 12회째 미출현"),
  ).toBeInTheDocument();
  expect(
    within(statistics).queryByText(result.explanation),
  ).not.toBeInTheDocument();
  expect(screen.getAllByText(result.explanation)).toHaveLength(1);
});

it("distinguishes empty statistics from an analysis failure", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        ...result,
        statisticsSummary: {
          mostFrequentNumbers: [],
          longestCurrentAbsences: [],
        },
      }),
      { status: 200 },
    ),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "조합 생성하기" }));
  const statistics = await screen.findByRole("region", {
    name: "분석 통계 요약",
  });
  expect(
    within(statistics).getByText("선택 기간에 출현한 번호가 없어요."),
  ).toBeInTheDocument();
  expect(
    within(statistics).getByText(
      "선택 기간에 미출현 회차를 계산할 번호가 없어요.",
    ),
  ).toBeInTheDocument();
});

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
  expect(
    screen.getByText(
      "번호나 의견을 추가하지 않아도 조합 생성하기를 눌러 만들 수 있어요.",
    ),
  ).toBeInTheDocument();
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
    screen.getByText(/별도 의견을 고르지 않으면 기본 프롬프트/),
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

it("shows selected numbers below the picker and lets each chip remove its number", async () => {
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "5번 고정" }));
  await userEvent.click(screen.getByRole("button", { name: "12번 고정" }));

  const selectedNumbers = screen.getByRole("region", { name: "선택한 번호" });
  expect(within(selectedNumbers).getAllByRole("listitem")).toHaveLength(2);
  const removeButton = within(selectedNumbers).getByRole("button", {
    name: "12번 선택 취소",
  });
  expect(removeButton).toHaveTextContent("×");

  await userEvent.click(removeButton);

  expect(within(selectedNumbers).getAllByRole("listitem")).toHaveLength(1);
  expect(
    within(selectedNumbers).queryByRole("button", { name: "12번 선택 취소" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "12번 고정" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

it("submits selected balls and a trimmed optional prompt in one request", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(result), { status: 200 }),
  );
  renderDashboard();
  await userEvent.click(screen.getByRole("button", { name: "9번 고정" }));
  await userEvent.click(screen.getByRole("button", { name: "1번 고정" }));
  await userEvent.click(screen.getByRole("button", { name: "새 의견" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: /새 의견 입력/ }),
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
