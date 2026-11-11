import { beforeEach, expect, it, vi } from "vitest";
import { syncLotteryDraws } from "./sync-lottery-draws";

const { createIndexMock, bulkWriteMock, findOneMock, fetchMock } = vi.hoisted(
  () => ({
    createIndexMock: vi.fn(),
    bulkWriteMock: vi.fn(),
    findOneMock: vi.fn(),
    fetchMock: vi.fn(),
  }),
);

vi.mock("@/shared/server/mongodb/client", () => ({
  getMongoDb: async () => ({
    collection: () => ({
      createIndex: createIndexMock,
      bulkWrite: bulkWriteMock,
      findOne: findOneMock,
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
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ data: { list: [row] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
});

it("fetches all published draws and upserts them by round", async () => {
  await expect(syncLotteryDraws()).resolves.toEqual({
    drawCount: 1,
    latestRound: 1,
  });

  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=all",
    expect.objectContaining({ cache: "no-store" }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do",
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
      new Response(JSON.stringify({ data: { list: [row] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { list: [latest] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

  await expect(syncLotteryDraws()).rejects.toThrow("latest published round");
  expect(bulkWriteMock).not.toHaveBeenCalled();
});

it("does not replace a newer stored history with a stale provider response", async () => {
  findOneMock.mockResolvedValue({ roundNumber: 2 });

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
