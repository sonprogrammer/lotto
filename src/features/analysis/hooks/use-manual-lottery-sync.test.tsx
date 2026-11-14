import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useManualLotterySync } from "./use-manual-lottery-sync";

function createHook() {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(() => useManualLotterySync(), { wrapper }),
    invalidateQueries,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

it("refreshes shared queries after a new round is applied", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ changed: true, latestRound: 1250 }),
  );
  const { result, invalidateQueries } = createHook();

  act(() => result.current.sync());

  await waitFor(() => expect(result.current.message).toContain("1250회"));
  expect(fetch).toHaveBeenCalledWith("/api/lottery-draws/sync", {
    method: "POST",
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["lottery-sync-status"],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["lottery-draw-history"],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["weekly-analysis"],
  });
});

it("only refreshes sync status when no result changed", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ changed: false, latestRound: 1249 }),
  );
  const { result, invalidateQueries } = createHook();

  act(() => result.current.sync());

  await waitFor(() => expect(result.current.message).toContain("새로 반영된"));
  expect(invalidateQueries).toHaveBeenCalledTimes(1);
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["lottery-sync-status"],
  });
});

it("exposes a retry message when the sync request fails", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json(
      { error: "당첨 번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    ),
  );
  const { result } = createHook();

  act(() => result.current.sync());

  await waitFor(() =>
    expect(result.current.errorMessage).toContain("다시 시도"),
  );
});
