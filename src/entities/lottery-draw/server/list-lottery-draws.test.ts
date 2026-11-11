import { beforeEach, expect, it, vi } from "vitest";
import { listLotteryDraws, listLotteryDrawsPage } from "./list-lottery-draws";

const { findMock, sortMock, limitMock, toArrayMock } = vi.hoisted(() => ({
  findMock: vi.fn(),
  sortMock: vi.fn(),
  limitMock: vi.fn(),
  toArrayMock: vi.fn(),
}));

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({
    collection: () => ({ find: findMock }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  findMock.mockReturnValue({ sort: sortMock });
  sortMock.mockReturnValue({ limit: limitMock, toArray: toArrayMock });
  limitMock.mockReturnValue({ toArray: toArrayMock });
  toArrayMock.mockResolvedValue([]);
});

it("loads history newest-first in pages and returns the next cursor", async () => {
  const rows = Array.from({ length: 21 }, (_, index) => ({
    _id: undefined,
    roundNumber: 1229 - index,
    drawDate: new Date("2026-11-07T00:00:00.000Z"),
    numbers: [2, 11, 16, 25, 34, 35],
    bonusNumber: 14,
    prizesByRank: [],
  }));
  toArrayMock.mockResolvedValue(rows);

  const result = await listLotteryDrawsPage({
    beforeRound: 1230,
    pageSize: 20,
  });

  expect(findMock).toHaveBeenCalledWith(
    { roundNumber: { $lt: 1230 } },
    {
      projection: {
        _id: 0,
        roundNumber: 1,
        drawDate: 1,
        numbers: 1,
        bonusNumber: 1,
        prizesByRank: 1,
      },
    },
  );
  expect(sortMock).toHaveBeenCalledWith({ roundNumber: -1 });
  expect(limitMock).toHaveBeenCalledWith(21);
  expect(result.draws).toHaveLength(20);
  expect(result.nextCursor).toBe(1210);
});

it("loads only analysis fields ordered by round", async () => {
  await listLotteryDraws();

  expect(findMock).toHaveBeenCalledWith(
    {},
    { projection: { _id: 0, roundNumber: 1, numbers: 1 } },
  );
  expect(sortMock).toHaveBeenCalledWith({ roundNumber: 1 });
  expect(toArrayMock).toHaveBeenCalledOnce();
});

it("returns valid analysis rows", async () => {
  const rows = [{ roundNumber: 1162, numbers: [5, 10, 16, 23, 35, 44] }];
  toArrayMock.mockResolvedValue(rows);

  await expect(listLotteryDraws()).resolves.toEqual(rows);
});

it("rejects invalid stored analysis rows", async () => {
  toArrayMock.mockResolvedValue([
    { roundNumber: 1162, numbers: [5, 10, 16, 23, 35, 35] },
  ]);

  await expect(listLotteryDraws()).rejects.toThrow();
});
