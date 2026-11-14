import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { LotterySyncStatusResponse } from "../hooks/use-lottery-sync-status";
import { LotterySyncStatus } from "./lottery-sync-status";

const baseStatus: LotterySyncStatusResponse = {
  lastAttemptAt: "2026-11-14T12:00:00.000Z",
  lastSuccessAt: "2026-11-14T12:00:00.000Z",
  state: "success",
  latestRound: 1249,
  errorSummary: null,
  nextExpectedAt: "2026-11-21T12:00:00.000Z",
};

it("shows loading, first-run, success and failure recovery states", () => {
  const { rerender } = render(
    <LotterySyncStatus isPending isError={false} onRetry={vi.fn()} />,
  );
  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");

  rerender(
    <LotterySyncStatus
      status={{
        ...baseStatus,
        state: "idle",
        lastSuccessAt: null,
        latestRound: null,
      }}
      isPending={false}
      isError={false}
      onRetry={vi.fn()}
    />,
  );
  expect(screen.getByText("첫 자동 갱신을 기다리는 중이에요.")).toBeVisible();

  rerender(
    <LotterySyncStatus
      status={baseStatus}
      isPending={false}
      isError={false}
      onRetry={vi.fn()}
    />,
  );
  expect(screen.getByText(/최근 1249회까지 반영/)).toBeVisible();

  rerender(
    <LotterySyncStatus
      status={{ ...baseStatus, state: "failed" }}
      isPending={false}
      isError={false}
      onRetry={vi.fn()}
    />,
  );
  expect(screen.getByText(/이전에 반영된 자료는 유지됩니다/)).toBeVisible();
  expect(
    screen.getByRole("link", { name: "분석 화면으로 이동" }),
  ).toHaveAttribute("href", "/analysis");
});

it("offers a retry if status could not be loaded", () => {
  const retry = vi.fn();
  render(<LotterySyncStatus isPending={false} isError onRetry={retry} />);

  expect(screen.getByRole("alert")).toHaveTextContent(
    "갱신 상태를 확인하지 못했어요.",
  );
  screen.getByRole("button", { name: "다시 확인" }).click();
  expect(retry).toHaveBeenCalledOnce();
});

it("offers manual sync and reports loading, unchanged and error states", () => {
  const sync = vi.fn();
  const props = {
    status: baseStatus,
    isPending: false,
    isError: false,
    onRetry: vi.fn(),
    isSyncing: false,
    syncMessage: null,
    syncErrorMessage: null,
    onSync: sync,
  };
  const { rerender } = render(<LotterySyncStatus {...props} />);

  fireEvent.click(screen.getByRole("button", { name: "당첨 번호 확인" }));
  expect(sync).toHaveBeenCalledOnce();

  rerender(<LotterySyncStatus {...props} isSyncing />);
  expect(screen.getByRole("button", { name: "확인 중..." })).toBeDisabled();

  rerender(
    <LotterySyncStatus
      {...props}
      syncMessage="새로 반영된 결과가 없어요. 현재 1249회까지 확인했어요."
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "새로 반영된 결과가 없어요",
  );

  rerender(
    <LotterySyncStatus
      {...props}
      syncErrorMessage="당첨 번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요."
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("다시 시도해 주세요");
});
