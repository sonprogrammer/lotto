import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LottoNumberPreview } from "./lotto-number-preview";
import { QueryProvider } from "@/shared/providers/query-provider";

function renderPreview() {
  return render(
    <QueryProvider>
      <LottoNumberPreview />
    </QueryProvider>,
  );
}

const { generateLottoNumbersMock } = vi.hoisted(() => ({
  generateLottoNumbersMock: vi.fn(),
}));

vi.mock("../lib/generate-lotto-numbers", () => ({
  generateLottoNumbers: generateLottoNumbersMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/",
}));

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
    generateLottoNumbersMock
      .mockReset()
      .mockReturnValueOnce([4, 12, 19, 28, 33, 45])
      .mockReturnValueOnce([2, 7, 11, 15, 21, 26])
      .mockReturnValue([3, 8, 13, 18, 23, 29]);
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
});
