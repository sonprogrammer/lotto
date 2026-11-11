import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, listLotteryDrawsMock, redirectMock } = vi.hoisted(
  () => ({
    getCurrentUserMock: vi.fn(),
    listLotteryDrawsMock: vi.fn(),
    redirectMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/lottery-draw/server/list-lottery-draws", () => ({
  listLotteryDraws: listLotteryDrawsMock,
}));
vi.mock("@/features/analysis/components/analysis-dashboard", () => ({
  AnalysisDashboard: (props: Record<string, unknown>) => props,
}));

import AnalysisPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  redirectMock.mockImplementation((path: string) => {
    throw new Error(`redirect:${path}`);
  });
  getCurrentUserMock.mockResolvedValue({
    userId: "user-1",
    nickname: "손영진",
  });
  listLotteryDrawsMock.mockResolvedValue([
    { roundNumber: 100, numbers: [1, 2, 3, 11, 23, 45] },
  ]);
});

it("requires a signed-in user", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  await expect(AnalysisPage()).rejects.toThrow("redirect:/");
  expect(listLotteryDrawsMock).not.toHaveBeenCalled();
});

it("loads and calculates data for the signed-in user", async () => {
  const element = await AnalysisPage();

  expect(element.props).toMatchObject({
    displayName: "손영진",
    state: "ready",
  });
  expect(element.props.analysis.latestRound).toBe(100);
});

it("returns a recoverable error state if draw data cannot be loaded", async () => {
  listLotteryDrawsMock.mockRejectedValue(new Error("database unavailable"));

  expect((await AnalysisPage()).props).toMatchObject({
    displayName: "손영진",
    analysis: null,
    state: "error",
  });
});
