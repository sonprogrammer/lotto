import { beforeEach, expect, it, vi } from "vitest";
import { syncLotteryDraws } from "./sync-lottery-draws";

const {
  createIndexMock,
  bulkWriteMock,
  findOneMock,
  countDocumentsMock,
  fetchMock,
} = vi.hoisted(() => ({
  createIndexMock: vi.fn(),
  bulkWriteMock: vi.fn(),
  findOneMock: vi.fn(),
  countDocumentsMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({
    collection: () => ({
      createIndex: createIndexMock,
      bulkWrite: bulkWriteMock,
      findOne: findOneMock,
      countDocuments: countDocumentsMock,
    }),
  }),
}));

const row = {
  ltEpsd: 1,
  ltRflYmd: "20021207",
  tm1WnNo: 10,
  tm2WnNo: 23,
  tm3WnNo: 29,
  tm4WnNo: 33,
  tm5WnNo: 37,
  tm6WnNo: 40,
  bnsWnNo: 16,
  rnk1WnNope: 14,
  rnk1WnAmt: 2025045509,
  rnk2WnNope: 93,
  rnk2WnAmt: 50807594,
  rnk3WnNope: 3550,
  rnk3WnAmt: 1331016,
  rnk4WnNope: 162101,
  rnk4WnAmt: 50000,
  rnk5WnNope: 2634961,
  rnk5WnAmt: 5000,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  createIndexMock.mockResolvedValue("roundNumber_1");
  bulkWriteMock.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });
  findOneMock.mockResolvedValue(null);
  countDocumentsMock.mockResolvedValue(1);
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ data: { list: [row] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
});

it("checks only the latest source record when stored history is current", async () => {
  findOneMock.mockResolvedValue({
    roundNumber: 1,
    drawDate: new Date(Date.UTC(2002, 11, 7)),
    numbers: [10, 23, 29, 33, 37, 40],
    bonusNumber: 16,
    prizesByRank: [
      { rank: 1, winnerCount: 14, amountPerWinner: 2025045509 },
      { rank: 2, winnerCount: 93, amountPerWinner: 50807594 },
      { rank: 3, winnerCount: 3550, amountPerWinner: 1331016 },
      { rank: 4, winnerCount: 162101, amountPerWinner: 50000 },
      { rank: 5, winnerCount: 2634961, amountPerWinner: 5000 },
    ],
  });

  await expect(syncLotteryDraws()).resolves.toMatchObject({
    drawCount: 1,
    latestRound: 1,
    changed: false,
  });

  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledWith(
    "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do",
    expect.objectContaining({ cache: "no-store" }),
  );
  expect(bulkWriteMock).not.toHaveBeenCalled();
});

it("refetches complete history when stored rounds are missing", async () => {
  findOneMock.mockResolvedValue({
    roundNumber: 1,
    drawDate: new Date(Date.UTC(2002, 11, 7)),
    numbers: [10, 23, 29, 33, 37, 40],
    bonusNumber: 16,
    prizesByRank: [
      { rank: 1, winnerCount: 14, amountPerWinner: 2025045509 },
      { rank: 2, winnerCount: 93, amountPerWinner: 50807594 },
      { rank: 3, winnerCount: 3550, amountPerWinner: 1331016 },
      { rank: 4, winnerCount: 162101, amountPerWinner: 50000 },
      { rank: 5, winnerCount: 2634961, amountPerWinner: 5000 },
    ],
  });
  countDocumentsMock.mockResolvedValue(0);

  await expect(syncLotteryDraws()).resolves.toMatchObject({
    drawCount: 1,
    latestRound: 1,
    changed: true,
  });

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(bulkWriteMock).toHaveBeenCalledOnce();
});

it("fetches all published draws and upserts them by round", async () => {
  await expect(syncLotteryDraws()).resolves.toEqual({
    drawCount: 1,
    latestRound: 1,
    changed: true,
    latestDrawVersion: expect.any(String),
  });

  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do",
    expect.objectContaining({ cache: "no-store" }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=all",
    expect.objectContaining({ cache: "no-store" }),
  );
  expect(createIndexMock).toHaveBeenCalledWith(
    { roundNumber: 1 },
    { unique: true },
  );
  expect(bulkWriteMock).toHaveBeenCalledWith(
    [
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: { roundNumber: 1 },
          upsert: true,
        }),
      }),
    ],
    { ordered: false },
  );
});

it("uses the highest round when the latest source endpoint returns multiple draws", async () => {
  const secondDraw = {
    ...row,
    ltEpsd: 2,
    ltRflYmd: "20021214",
    tm1WnNo: 1,
    tm2WnNo: 2,
    tm3WnNo: 3,
    tm4WnNo: 4,
    tm5WnNo: 5,
    tm6WnNo: 6,
    bnsWnNo: 7,
  };
  fetchMock
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { list: [row, secondDraw] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { list: [row, secondDraw] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

  await expect(syncLotteryDraws()).resolves.toMatchObject({
    drawCount: 2,
    latestRound: 2,
    changed: true,
  });
  expect(bulkWriteMock.mock.calls[0][0]).toHaveLength(2);
});

it("does not save an incomplete history response", async () => {
  const incomplete = { ...row, ltEpsd: 2 };
  fetchMock
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { list: [incomplete] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { list: [incomplete] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

  await expect(syncLotteryDraws()).rejects.toThrow("incomplete");
  expect(bulkWriteMock).not.toHaveBeenCalled();
});

it("rejects a contiguous history response that stops before the latest draw", async () => {
  const latest = { ...row, ltEpsd: 2, ltRflYmd: "20021214" };
  fetchMock
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { list: [latest] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { list: [row] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

  await expect(syncLotteryDraws()).rejects.toThrow("incomplete history");
  expect(bulkWriteMock).not.toHaveBeenCalled();
});

it("does not replace a newer stored history with a stale provider response", async () => {
  findOneMock.mockResolvedValue({
    roundNumber: 2,
    drawDate: new Date(Date.UTC(2002, 11, 14)),
    numbers: [10, 23, 29, 33, 37, 40],
    bonusNumber: 16,
    prizesByRank: [
      { rank: 1, winnerCount: 14, amountPerWinner: 2025045509 },
      { rank: 2, winnerCount: 93, amountPerWinner: 50807594 },
      { rank: 3, winnerCount: 3550, amountPerWinner: 1331016 },
      { rank: 4, winnerCount: 162101, amountPerWinner: 50000 },
      { rank: 5, winnerCount: 2634961, amountPerWinner: 5000 },
    ],
  });

  await expect(syncLotteryDraws()).rejects.toThrow(
    "Stored lottery history is newer",
  );
  expect(bulkWriteMock).not.toHaveBeenCalled();
});

it("does not write data when the provider returns HTML", async () => {
  fetchMock.mockResolvedValue(
    new Response("temporarily unavailable", {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
  );

  await expect(syncLotteryDraws()).rejects.toThrow();
  expect(bulkWriteMock).not.toHaveBeenCalled();
});
