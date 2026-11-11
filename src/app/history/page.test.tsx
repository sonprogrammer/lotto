import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, redirectMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/features/analysis/components/lottery-draw-history", () => ({
  LotteryDrawHistory: (props: Record<string, unknown>) => props,
}));

import HistoryPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  redirectMock.mockImplementation((path: string) => {
    throw new Error(`redirect:${path}`);
  });
  getCurrentUserMock.mockResolvedValue({
    userId: "user-1",
    nickname: "손영진",
  });
});

it("protects history for signed-in users and passes the profile name", async () => {
  expect(await HistoryPage()).toMatchObject({
    props: { displayName: "손영진" },
  });
});

it("redirects guests to the preview page", async () => {
  getCurrentUserMock.mockResolvedValue(null);
  await expect(HistoryPage()).rejects.toThrow("redirect:/");
});
