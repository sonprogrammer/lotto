import { z } from "zod";
import {
  SajuAiContextSchema,
  type SajuAiContext,
} from "../model/daily-saju-input";

const DailyNumberSchema = z.strictObject({
  number: z.number().int().min(1).max(45),
  explanation: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine(
      (value) => /\p{Script=Hangul}/u.test(value) && !/[A-Za-z]/.test(value),
    )
    .refine((value) => value.split(/\r?\n/).length <= 2),
});

const GroqResponseSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
});

const responseSchema = {
  type: "object",
  properties: {
    number: { type: "integer", minimum: 1, maximum: 45 },
    explanation: { type: "string" },
  },
  required: ["number", "explanation"],
  additionalProperties: false,
};

export class GroqDailyNumberError extends Error {
  constructor(
    public readonly kind:
      | "configuration"
      | "rate-limit"
      | "timeout"
      | "invalid-response"
      | "upstream",
    message: string,
  ) {
    super(message);
    this.name = "GroqDailyNumberError";
  }
}

export async function getGroqDailyNumber(
  context: SajuAiContext,
): Promise<{ number: number; explanation: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqDailyNumberError(
      "configuration",
      "Groq API key is not configured",
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "사주 정보를 참고해 오늘의 재미용 로또 숫자 하나를 1부터 45 사이에서 선택하세요. 당첨 예측이나 확률 상승을 주장하지 말고 짧고 자연스러운 한국어로 한두 문장 설명하세요. 영문이나 알파벳을 쓰지 말고 지정된 JSON 형식으로 응답하세요.",
          },
          {
            role: "user",
            content: JSON.stringify(SajuAiContextSchema.parse(context)),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "daily_saju_number",
            strict: true,
            schema: responseSchema,
          },
        },
      }),
    });
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "name" in error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new GroqDailyNumberError(
        "timeout",
        "Groq request timed out; try again",
      );
    }
    throw new GroqDailyNumberError(
      "upstream",
      "Groq request failed; try again",
    );
  }

  if (response.status === 429) {
    throw new GroqDailyNumberError(
      "rate-limit",
      "Groq rate limit exceeded; try again later",
    );
  }
  if (!response.ok) {
    throw new GroqDailyNumberError(
      "upstream",
      "Groq request failed; try again",
    );
  }

  try {
    const envelope = GroqResponseSchema.parse(await response.json());
    return DailyNumberSchema.parse(
      JSON.parse(envelope.choices[0].message.content),
    );
  } catch {
    throw new GroqDailyNumberError(
      "invalid-response",
      "Invalid Groq daily number",
    );
  }
}
