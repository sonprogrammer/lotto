import { beforeEach, expect, it, vi } from "vitest";
import {
  listLotteryDraws,
  listLotteryDrawsPage,
  listRecentLotteryDrawRecords,
} from "./list-lottery-draws";

const {
  findMock,
  findOneMock,
  sortMock,
  limitMock,
  toArrayMock,
  cacheLifeMock,
  cacheTagMock,
} = vi.hoisted(() => ({
  findMock: vi.fn(),
  findOneMock: vi.fn(),
  sortMock: vi.fn(),
  limitMock: vi.fn(),
  toArrayMock: vi.fn(),
  cacheLifeMock: vi.fn(),
  cacheTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheLife: cacheLifeMock,
  cacheTag: cacheTagMock,
}));
vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({
    collection: () => ({ find: findMock, findOne: findOneMock }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  findOneMock.mockResolvedValue(null);
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

it("loads recent complete draw records newest-first from the shared cache", async () => {
  findOneMock.mockResolvedValue({
    roundNumber: 100,
    drawDate: new Date("2026-11-07T00:00:00.000Z"),
    numbers: [1, 2, 3, 4, 5, 6],
    bonusNumber: 7,
    prizesByRank: [],
  });
  const rows = [
    {
      roundNumber: 100,
      drawDate: new Date("2026-11-07T00:00:00.000Z"),
      numbers: [1, 2, 3, 4, 5, 6],
      bonusNumber: 7,
      prizesByRank: [],
    },
    {
      roundNumber: 99,
      drawDate: new Date("2026-10-31T00:00:00.000Z"),
      numbers: [2, 3, 4, 5, 6, 7],
      bonusNumber: 8,
      prizesByRank: [],
    },
  ];
  toArrayMock.mockResolvedValue(rows);

  const result = await listRecentLotteryDrawRecords(2);

  expect(findOneMock).toHaveBeenCalledWith(
    {},
    expect.objectContaining({ sort: { roundNumber: -1 } }),
  );
  expect(findMock).toHaveBeenCalledWith(
    { roundNumber: { $lte: 100 } },
    expect.objectContaining({
      projection: expect.objectContaining({ prizesByRank: 1 }),
    }),
  );
  expect(sortMock).toHaveBeenCalledWith({ roundNumber: -1 });
  expect(limitMock).toHaveBeenCalledWith(2);
  expect(result.map(({ roundNumber }) => roundNumber)).toEqual([99, 100]);
  expect(cacheLifeMock).toHaveBeenCalledWith("days");
});

it("clamps recent record reads to a safe count and returns empty when no draws exist", async () => {
  findOneMock.mockResolvedValue(null);

  await expect(listRecentLotteryDrawRecords(0)).resolves.toEqual([]);
  expect(findMock).not.toHaveBeenCalled();
});
