import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, createMock, listMock, SimulationInputErrorMock } =
  vi.hoisted(() => ({
    getCurrentUserMock: vi.fn(),
    createMock: vi.fn(),
    listMock: vi.fn(),
    SimulationInputErrorMock: class SimulationInputError extends Error {},
  }));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/features/simulation/server/create-simulation", () => ({
  createSimulationForUser: createMock,
  SimulationInputError: SimulationInputErrorMock,
}));
vi.mock("@/entities/simulation/server/simulation-store", () => ({
  listSimulationRuns: listMock,
}));

import { GET, POST } from "./route";

const user = { userId: "65ab12cd34ef56ab78cd90ef", nickname: "영진" };
const request = (method: string, body?: unknown) =>
  new Request("http://localhost/api/simulations", {
    method,
    ...(body !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue(user);
  createMock.mockResolvedValue({ id: "run-id", rounds: [] });
  listMock.mockResolvedValue([]);
});

it("lists the authenticated user's runs with private cache headers", async () => {
  const response = await GET();

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(listMock).toHaveBeenCalledWith(user.userId, 20);
});

it("requires login for simulation operations", async () => {
  getCurrentUserMock.mockResolvedValue(null);

  expect((await GET()).status).toBe(401);
  expect(
    (await POST(request("POST", { combinationsPerRound: 5 }))).status,
  ).toBe(401);
  expect(createMock).not.toHaveBeenCalled();
  expect(listMock).not.toHaveBeenCalled();
});

it("runs the default five combinations when the setting is omitted", async () => {
  const response = await POST(request("POST", {}));

  expect(response.status).toBe(201);
  expect(createMock).toHaveBeenCalledWith(user.userId, 5);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});

it("accepts a configured count from one to ten", async () => {
  const response = await POST(request("POST", { combinationsPerRound: 3 }));

  expect(response.status).toBe(201);
  expect(createMock).toHaveBeenCalledWith(user.userId, 3);
});

it("rejects malformed payloads before running the simulation", async () => {
  expect(
    (await POST(request("POST", { combinationsPerRound: 11 }))).status,
  ).toBe(400);
  expect((await POST(request("POST", { prompt: "AI로 분석해" }))).status).toBe(
    400,
  );
  expect(
    (
      await POST(
        new Request("http://localhost/api/simulations", {
          method: "POST",
          body: "{",
        }),
      )
    ).status,
  ).toBe(400);
  expect(createMock).not.toHaveBeenCalled();
});

it("explains when history is too short and hides infrastructure details", async () => {
  createMock.mockRejectedValueOnce(
    new SimulationInputErrorMock("At least 60 completed rounds are required"),
  );
  const insufficient = await POST(request("POST", {}));
  expect(insufficient.status).toBe(400);
  expect(await insufficient.json()).toMatchObject({
    error: "시뮬레이션하려면 최소 60회차의 당첨 자료가 필요해요.",
    retryable: false,
  });

  createMock.mockRejectedValueOnce(new Error("private database error"));
  const failed = await POST(request("POST", {}));
  expect(failed.status).toBe(502);
  const failedBody = await failed.json();
  expect(failedBody).toMatchObject({ retryable: true });
  expect(JSON.stringify(failedBody)).not.toContain("private database error");
});

it("reports discontinuous draw history as a non-retryable history error", async () => {
  createMock.mockRejectedValueOnce(
    new SimulationInputErrorMock("Simulation draw history must be continuous"),
  );

  const response = await POST(request("POST", {}));

  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: "당첨 회차 자료에 누락이 있어 시뮬레이션할 수 없어요.",
    retryable: false,
  });
});
