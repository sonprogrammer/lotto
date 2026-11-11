import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, redirectMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
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
});

it("requires a signed-in user", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  await expect(AnalysisPage()).rejects.toThrow("redirect:/");
});

it("renders the analysis action for the signed-in user", async () => {
  const element = await AnalysisPage();

  expect(element.props).toMatchObject({
    displayName: "손영진",
  });
});

it("does not replace a missing nickname with a generic account label", async () => {
  getCurrentUserMock.mockResolvedValue({ userId: "user-1", nickname: null });

  expect((await AnalysisPage()).props.displayName).toBeUndefined();
});
