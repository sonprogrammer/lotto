import { beforeEach, expect, it, vi } from "vitest";
import { listLotteryDraws } from "./list-lottery-draws";

const { findMock, sortMock, toArrayMock } = vi.hoisted(() => ({
  findMock: vi.fn(),
  sortMock: vi.fn(),
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
  sortMock.mockReturnValue({ toArray: toArrayMock });
  toArrayMock.mockResolvedValue([]);
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
