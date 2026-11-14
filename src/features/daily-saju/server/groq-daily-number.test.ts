import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SajuAiContext } from "../model/daily-saju-input";
import { getGroqDailyNumber } from "./groq-daily-number";

const context: SajuAiContext = {
  birthPillars: {
    year: "임신",
    month: "경술",
    day: "계유",
    hour: "을묘",
  },
  today: { dateKey: "2026-11-14", dayPillar: "병오" },
};

const output = {
  number: 23,
  explanation: "오늘의 일진을 바탕으로 고른 숫자입니다.",
};

function groqResponse(content: unknown) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );
}

describe("getGroqDailyNumber", () => {
  beforeEach(() => vi.stubEnv("GROQ_API_KEY", "server-secret"));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("requests one structured Korean daily number using only calculated pillars", async () => {
    const fetchMock = vi.fn().mockResolvedValue(groqResponse(output));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGroqDailyNumber(context)).resolves.toEqual(output);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe("openai/gpt-oss-120b");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[1].content).toContain("계유");
    expect(body.messages[1].content).not.toMatch(/영진|1990|kakao|userId/i);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    { number: 0, explanation: output.explanation },
    { number: 46, explanation: output.explanation },
    { number: 1.5, explanation: output.explanation },
    { number: 2, explanation: "Based on today's pillars" },
    { number: 2, explanation: "오늘은 좋은 energy입니다." },
    {
      number: 2,
      explanation:
        "한국어 설명입니다.\n두 번째 문장입니다.\n세 번째 문장입니다.",
    },
  ])("rejects invalid AI output: $number", async (invalid) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(groqResponse(invalid)));
    await expect(getGroqDailyNumber(context)).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });

  it("does not call Groq without a server key", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getGroqDailyNumber(context)).rejects.toMatchObject({
      kind: "configuration",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("converts provider errors to a typed error without exposing response content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("secret body", { status: 429 })),
    );
    await expect(getGroqDailyNumber(context)).rejects.toMatchObject({
      kind: "rate-limit",
      message: "Groq rate limit exceeded; try again later",
    });
  });
});
