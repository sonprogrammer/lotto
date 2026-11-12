import { beforeEach, expect, it, vi } from "vitest";

const { getCurrentUserMock, runGenerationMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  runGenerationMock: vi.fn(),
}));

vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock(
  "@/features/generation/server/run-generation",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/generation/server/run-generation")
    >()),
    runGeneration: runGenerationMock,
  }),
);

import { POST } from "./route";
import { GenerationInputError } from "@/features/generation/server/run-generation";
import { GroqProviderError } from "@/features/generation/server/groq-recommendation";

function request(body: unknown): Request {
  return new Request("http://localhost/api/generation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue({ userId: "secret-user" });
  runGenerationMock.mockResolvedValue({
    combinations: [],
    explanation: "요약",
  });
});

it("requires login before reading the request or generating combinations", async () => {
  getCurrentUserMock.mockResolvedValue(null);
  const response = await POST(request({}));
  expect(response.status).toBe(401);
  expect(runGenerationMock).not.toHaveBeenCalled();
});

it("rejects invalid requests before generation", async () => {
  const response = await POST(request({ count: 11 }));
  expect(response.status).toBe(400);
  expect(runGenerationMock).not.toHaveBeenCalled();
});

it("accepts no selected numbers and returns the result without passing user identity", async () => {
  const result = {
    combinations: [{ numbers: [1, 2, 3, 4, 5, 6], score: 1 }],
    latestRound: 1249,
    period: {
      type: "recent",
      count: 30,
      drawCount: 30,
      firstRound: 1220,
      latestRound: 1249,
    },
    appliedConstraints: {},
    unsupportedConditions: [],
    explanation: "통계 요약",
    seed: "seed",
  };
  runGenerationMock.mockResolvedValue(result);
  const response = await POST(request({ fixedNumbers: [] }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(runGenerationMock).toHaveBeenCalledWith({
    fixedNumbers: [],
    count: 5,
    period: { type: "recent", count: 30 },
  });
});

it("returns unsatisfiable conditions as a bad request", async () => {
  runGenerationMock.mockRejectedValue(new GenerationInputError("조건 충돌"));
  const response = await POST(request({}));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "조건 충돌" });
});

it("returns retryable upstream failures", async () => {
  runGenerationMock.mockRejectedValue(new Error("provider or AI failed"));
  const response = await POST(request({}));
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({
    error: "생성 자료를 가져오지 못했어요. 다시 시도해 주세요.",
    retryable: true,
  });
});

it.each([
  ["rate-limit", 429, "AI 사용 한도에 도달했어요. 잠시 후 다시 시도해 주세요."],
  ["timeout", 504, "AI 응답 시간이 초과됐어요. 다시 시도해 주세요."],
  ["invalid-response", 502, "AI 응답을 처리하지 못했어요. 다시 시도해 주세요."],
] as const)(
  "maps Groq %s to a retryable %s response",
  async (kind, status, message) => {
    runGenerationMock.mockRejectedValue(
      new GroqProviderError(kind, "internal detail"),
    );
    const response = await POST(request({}));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: message, retryable: true });
  },
);

it.each([
  { fixedNumbers: [0] },
  { fixedNumbers: [46] },
  { fixedNumbers: [1.5] },
  { fixedNumbers: [1, 1] },
  { fixedNumbers: [1, 2, 3, 4, 5, 6, 7] },
])(
  "rejects invalid selected numbers $fixedNumbers before generation",
  async ({ fixedNumbers }) => {
    const response = await POST(request({ fixedNumbers }));
    expect(response.status).toBe(400);
    expect(runGenerationMock).not.toHaveBeenCalled();
  },
);
