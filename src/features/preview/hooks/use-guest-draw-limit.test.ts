import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useGuestDrawLimit } from "./use-guest-draw-limit";

beforeEach(() => {
  window.localStorage.clear();
});

it("restores a draw count from browser storage after remounting", async () => {
  const firstRender = renderHook(() => useGuestDrawLimit());
  await waitFor(() => expect(firstRender.result.current.isReady).toBe(true));
  act(() => {
    expect(firstRender.result.current.tryRecordDraw()).toBe(true);
  });
  firstRender.unmount();

  const secondRender = renderHook(() => useGuestDrawLimit());
  await waitFor(() => expect(secondRender.result.current.isReady).toBe(true));

  expect(secondRender.result.current.drawCount).toBe(1);
});

it("records no more than three draws", async () => {
  const { result } = renderHook(() => useGuestDrawLimit());
  await waitFor(() => expect(result.current.isReady).toBe(true));

  act(() => {
    expect(result.current.tryRecordDraw()).toBe(true);
    expect(result.current.tryRecordDraw()).toBe(true);
    expect(result.current.tryRecordDraw()).toBe(true);
    expect(result.current.tryRecordDraw()).toBe(false);
  });

  expect(result.current.drawCount).toBe(3);
});

it("keeps the limit for the current page session when storage is unavailable", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("storage unavailable");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("storage unavailable");
  });

  const { result } = renderHook(() => useGuestDrawLimit());
  await waitFor(() => expect(result.current.isReady).toBe(true));

  act(() => {
    expect(result.current.tryRecordDraw()).toBe(true);
    expect(result.current.tryRecordDraw()).toBe(true);
    expect(result.current.tryRecordDraw()).toBe(true);
    expect(result.current.tryRecordDraw()).toBe(false);
  });

  expect(result.current.drawCount).toBe(3);
});
