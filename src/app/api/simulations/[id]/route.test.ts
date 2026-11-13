import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, getMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/entities/simulation/server/simulation-store", () => ({
  getSimulationRun: getMock,
}));

import { GET } from "./route";

const id = "65ab12cd34ef56ab78cd9001";
const user = { userId: "65ab12cd34ef56ab78cd90ef", nickname: "영진" };
const context = { params: Promise.resolve({ id }) };

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue(user);
  getMock.mockResolvedValue({ id, rounds: [] });
});

it("returns a private run detail for the signed-in user", async () => {
  const response = await GET(
    new Request(`http://localhost/api/simulations/${id}`),
    context,
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(getMock).toHaveBeenCalledWith(user.userId, id);
});

it("requires login and returns 404 for a missing or foreign run", async () => {
  getCurrentUserMock.mockResolvedValue(null);
  expect(
    (await GET(new Request(`http://localhost/api/simulations/${id}`), context))
      .status,
  ).toBe(401);
  expect(getMock).not.toHaveBeenCalled();

  getCurrentUserMock.mockResolvedValue(user);
  getMock.mockResolvedValue(null);
  expect(
    (await GET(new Request(`http://localhost/api/simulations/${id}`), context))
      .status,
  ).toBe(404);
  expect(getMock).toHaveBeenCalledWith(user.userId, id);
});

it("rejects malformed IDs before reading a run", async () => {
  const response = await GET(
    new Request("http://localhost/api/simulations/nope"),
    { params: Promise.resolve({ id: "nope" }) },
  );

  expect(response.status).toBe(400);
  expect(getMock).not.toHaveBeenCalled();
});
