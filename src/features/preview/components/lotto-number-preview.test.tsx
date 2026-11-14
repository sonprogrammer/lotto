import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LottoNumberPreview } from "./lotto-number-preview";
import { QueryProvider } from "@/shared/providers/query-provider";

function renderPreview(isConfigured = true) {
  const result = render(
    <QueryProvider>
      <LottoNumberPreview isConfigured={isConfigured} />
    </QueryProvider>,
  );

  act(() => {
    vi.advanceTimersByTime(0);
  });

  return result;
}

const {
  generateLottoNumbersMock,
  startSignInMock,
  explainMissingConfigurationMock,
  toastInfoMock,
} = vi.hoisted(() => ({
  generateLottoNumbersMock: vi.fn(),
  startSignInMock: vi.fn(),
  explainMissingConfigurationMock: vi.fn(),
  toastInfoMock: vi.fn(),
}));

vi.mock("../lib/generate-lotto-numbers", () => ({
  generateLottoNumbers: generateLottoNumbersMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/features/auth/hooks/use-auth-control", () => ({
  useAuthControl: () => ({
    isPending: false,
    startSignIn: startSignInMock,
    explainMissingConfiguration: explainMissingConfigurationMock,
  }),
}));

vi.mock("sonner", () => ({ toast: { info: toastInfoMock } }));

function setReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
}

function advanceReveal() {
  act(() => {
    vi.advanceTimersByTime(500);
  });
}

describe("LottoNumberPreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
    window.localStorage.clear();
    generateLottoNumbersMock
      .mockReset()
      .mockReturnValueOnce([4, 12, 19, 28, 33, 45])
      .mockReturnValueOnce([2, 7, 11, 15, 21, 26])
      .mockReturnValue([3, 8, 13, 18, 23, 29]);
    startSignInMock.mockReset();
    explainMissingConfigurationMock.mockReset();
    toastInfoMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows six empty balls without exposing numbers before a draw", () => {
    renderPreview();

    expect(screen.getAllByRole("img")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "번호 뽑기" })).toBeEnabled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("reveals each number in order and announces the finished combination", () => {
    renderPreview();

    fireEvent.click(screen.getByRole("button", { name: "번호 뽑기" }));

    expect(
      screen.getByRole("button", { name: "번호를 섞는 중" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("img", { name: "1번 공, 숫자 섞는 중" }),
    ).toHaveTextContent("2");
    expect(
      screen.getByRole("img", { name: "6번 공, 숫자 섞는 중" }),
    ).toHaveClass("lotto-ball-gold");

    act(() => {
      vi.advanceTimersByTime(90);
    });
    expect(
      screen.getByRole("img", { name: "1번 공, 숫자 섞는 중" }),
    ).toHaveTextContent("3");

    advanceReveal();
    expect(
      screen.getByRole("img", { name: "1번 공, 숫자 4" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "2번 공, 숫자 섞는 중" }),
    ).toBeInTheDocument();

    advanceReveal();
    expect(
      screen.getByRole("img", { name: "2번 공, 숫자 12" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "3번 공, 숫자 섞는 중" }),
    ).toBeInTheDocument();

    advanceReveal();
    advanceReveal();
    advanceReveal();
    advanceReveal();

    expect(
      screen.getByRole("img", { name: "6번 공, 숫자 45" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "생성된 번호: 4, 12, 19, 28, 33, 45",
    );
    expect(screen.getByRole("button", { name: "다시 뽑기" })).toBeEnabled();
  });

  it("clears the previous result and allows another draw after completion", () => {
    renderPreview();

    fireEvent.click(screen.getByRole("button", { name: "번호 뽑기" }));
    for (let step = 0; step < 6; step += 1) advanceReveal();

    fireEvent.click(screen.getByRole("button", { name: "다시 뽑기" }));

    expect(
      screen.getByRole("img", { name: "1번 공, 숫자 섞는 중" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(
      screen.getByRole("button", { name: "번호를 섞는 중" }),
    ).toBeDisabled();
  });

  it("skips rolling and timed waits when reduced motion is preferred", () => {
    setReducedMotion(true);
    renderPreview();

    fireEvent.click(screen.getByRole("button", { name: "번호 뽑기" }));

    expect(
      screen.getByRole("img", { name: "6번 공, 숫자 45" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "생성된 번호: 4, 12, 19, 28, 33, 45",
    );
    expect(screen.getByRole("button", { name: "다시 뽑기" })).toBeEnabled();
  });

  it("promotes the daily saju number and starts Kakao sign in", () => {
    renderPreview();

    expect(
      screen.getByText(
        /로그인 후 사주 정보를 등록하면 매일 사주 기반 행운 숫자/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "카카오로 로그인하기" }),
    );

    expect(startSignInMock).toHaveBeenCalledOnce();
  });

  it("explains when Kakao sign in is not configured", () => {
    renderPreview(false);

    fireEvent.click(
      screen.getByRole("button", { name: "카카오로 로그인하기" }),
    );

    expect(explainMissingConfigurationMock).toHaveBeenCalledOnce();
  });

  it("shows the guest draw count and blocks the fourth draw with a login toast", () => {
    setReducedMotion(true);
    renderPreview();

    expect(screen.getByText("이 브라우저 무료 체험 0/3회")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "번호 뽑기" }));
    expect(screen.getByText("이 브라우저 무료 체험 1/3회")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 뽑기" }));
    expect(screen.getByText("이 브라우저 무료 체험 2/3회")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 뽑기" }));
    expect(screen.getByText("이 브라우저 무료 체험 3/3회")).toBeInTheDocument();

    const generationCallCount = generateLottoNumbersMock.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "다시 뽑기" }));

    expect(generateLottoNumbersMock).toHaveBeenCalledTimes(generationCallCount);
    expect(toastInfoMock).toHaveBeenCalledWith(
      "이 브라우저의 무료 체험 3회를 모두 사용했어요. 카카오 로그인 후 계속 이용할 수 있어요.",
    );
  });
});
