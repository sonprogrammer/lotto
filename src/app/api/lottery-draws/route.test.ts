import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, listLotteryDrawsPageMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  listLotteryDrawsPageMock: vi.fn(),
}));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/lottery-draw", () => ({
  listLotteryDrawsPage: listLotteryDrawsPageMock,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue({ userId: "user-1", nickname: "진" });
  listLotteryDrawsPageMock.mockResolvedValue({ draws: [], nextCursor: null });
});

it("returns the newest draw page and cursor", async () => {
  const response = await GET(
    new Request("https://lotto.example/api/lottery-draws"),
  );

  expect(response.status).toBe(200);
  expect(listLotteryDrawsPageMock).toHaveBeenCalledWith({
    beforeRound: undefined,
    pageSize: 20,
  });
  expect(await response.json()).toEqual({ draws: [], nextCursor: null });
});

it("rejects malformed cursors", async () => {
  const response = await GET(
    new Request("https://lotto.example/api/lottery-draws?cursor=abc"),
  );

  expect(response.status).toBe(400);
  expect(listLotteryDrawsPageMock).not.toHaveBeenCalled();
});

it("requires an authenticated user", async () => {
  getCurrentUserMock.mockResolvedValue(null);
  const response = await GET(
    new Request("https://lotto.example/api/lottery-draws"),
  );

  expect(response.status).toBe(401);
  expect(listLotteryDrawsPageMock).not.toHaveBeenCalled();
});
