import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getGroqRecommendation } from "./groq-recommendation";

const input = {
  prompt: "홀수 3개, 7 제외. 생일에 맞는 번호도 골라줘",
  fixedNumbers: [4],
  analysisSummary: {
    drawCount: 30,
    latestRound: 1200,
    numberFrequencies: [{ number: 4, count: 6, drawsSinceLastAppearance: 2 }],
    oddCountDistribution: [0, 1, 4, 12, 8, 4, 1],
    lowCountDistribution: [0, 2, 5, 10, 8, 4, 1],
    numberBandCounts: [{ start: 1, end: 10, count: 35 }],
    consecutiveDrawCount: 12,
    consecutivePairCount: 14,
    longestConsecutiveRun: 3,
  },
};

const recommendation = {
  constraints: {
    excludedNumbers: [7],
    oddCount: 3,
    lowCount: null,
    minNumber: null,
    maxNumber: null,
    allowConsecutive: null,
  },
  unsupportedConditions: ["생일에 맞는 번호"],
  explanation:
    "최근 30회 출현 빈도와 홀짝 분포를 참고합니다.\n이 기준은 당첨 확률을 높이지 않습니다.",
};

function groqResponse(content: unknown) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );
}

describe("getGroqRecommendation", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "server-secret");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("makes one strict Groq request and returns generator-compatible constraints plus one batch explanation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(groqResponse(recommendation));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getGroqRecommendation(input);

    expect(result).toEqual({
      constraints: { excludedNumbers: [7], oddCount: 3 },
      unsupportedConditions: ["생일에 맞는 번호"],
      explanation: recommendation.explanation,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(options.headers).toEqual({
      Authorization: "Bearer server-secret",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe("openai/gpt-oss-120b");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[1].content).toContain(input.prompt);
    expect(body.messages[1].content).toContain("1200");
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("does not call Groq without a server key", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGroqRecommendation(input)).rejects.toThrow(
      "Groq API key is not configured",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed or incompatible Groq output", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        groqResponse({
          ...recommendation,
          constraints: { ...recommendation.constraints, excludedNumbers: [47] },
        }),
      ),
    );

    await expect(getGroqRecommendation(input)).rejects.toThrow(
      "Invalid Groq recommendation",
    );
  });

  it("reports rate limits without leaking the response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("server-secret", { status: 429 })),
    );

    await expect(getGroqRecommendation(input)).rejects.toMatchObject({
      kind: "rate-limit",
      message: "Groq rate limit exceeded; try again later",
    });
  });

  it("reports a timeout without making another request", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGroqRecommendation(input)).rejects.toMatchObject({
      kind: "timeout",
      message: "Groq request timed out; try again",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("exposes a typed provider error for an invalid AI response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(groqResponse({ invalid: true })),
    );
    await expect(getGroqRecommendation(input)).rejects.toMatchObject({
      kind: "invalid-response",
      name: "GroqProviderError",
    });
  });

  it.each([
    {
      name: "excluded fixed number",
      fixedNumbers: [4],
      constraints: { excludedNumbers: [4] },
      reason: "제외 번호",
    },
    {
      name: "fixed number below minimum",
      fixedNumbers: [4],
      constraints: { minNumber: 5 },
      reason: "번호 범위",
    },
    {
      name: "fixed number above maximum",
      fixedNumbers: [40],
      constraints: { maxNumber: 39 },
      reason: "번호 범위",
    },
    {
      name: "too many fixed odd numbers",
      fixedNumbers: [1, 3, 5, 7, 9],
      constraints: { oddCount: 4 },
      reason: "홀수 개수",
    },
    {
      name: "too few remaining slots for odd numbers",
      fixedNumbers: [2, 4, 6, 8, 10],
      constraints: { oddCount: 2 },
      reason: "홀수 개수",
    },
    {
      name: "too many fixed low numbers",
      fixedNumbers: [2, 4, 6, 8, 10],
      constraints: { lowCount: 4 },
      reason: "낮은 번호 개수",
    },
    {
      name: "too few remaining slots for low numbers",
      fixedNumbers: [30, 32, 34, 36, 38],
      constraints: { lowCount: 2 },
      reason: "낮은 번호 개수",
    },
    {
      name: "adjacent fixed numbers when consecutive numbers are disallowed",
      fixedNumbers: [4, 5],
      constraints: { allowConsecutive: false },
      reason: "연속 번호",
    },
  ])(
    "rejects $name before treating AI conditions as applied",
    async ({ fixedNumbers, constraints, reason }) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          groqResponse({
            ...recommendation,
            constraints: {
              ...recommendation.constraints,
              excludedNumbers: [],
              oddCount: null,
              ...constraints,
            },
          }),
        ),
      );

      await expect(
        getGroqRecommendation({ ...input, fixedNumbers }),
      ).rejects.toThrow(reason);
    },
  );
});
