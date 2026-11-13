import { z } from "zod";
import type { WeeklyAnalysis } from "@/features/analysis";
import {
  GenerationConstraintsSchema,
  type GenerationConstraints,
} from "@/features/generation/lib/generate-combinations";

const LotteryNumberSchema = z.number().int().min(1).max(45);
const KoreanUserFacingTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(400)
  .refine(
    (value) => /\p{Script=Hangul}/u.test(value) && !/[A-Za-z]/.test(value),
  );
const RecommendationSchema = z.strictObject({
  constraints: z.strictObject({
    excludedNumbers: z.array(LotteryNumberSchema).max(45),
    oddCount: z.number().int().min(0).max(6).nullable(),
    lowCount: z.number().int().min(0).max(6).nullable(),
    minNumber: LotteryNumberSchema.nullable(),
    maxNumber: LotteryNumberSchema.nullable(),
    allowConsecutive: z.boolean().nullable(),
  }),
  unsupportedConditions: z.array(KoreanUserFacingTextSchema.max(200)).max(20),
  explanation: KoreanUserFacingTextSchema.refine(
    (value) => value.split(/\r?\n/).length <= 2,
  ),
});

export type GroqRecommendationInput = {
  prompt?: string;
  fixedNumbers: readonly number[];
  analysisSummary: WeeklyAnalysis;
};

export type GroqRecommendation = {
  constraints: GenerationConstraints;
  unsupportedConditions: string[];
  explanation: string;
};

export class GroqProviderError extends Error {
  constructor(
    public readonly kind:
      | "rate-limit"
      | "timeout"
      | "invalid-response"
      | "upstream"
      | "configuration",
    message: string,
  ) {
    super(message);
    this.name = "GroqProviderError";
  }
}

const nullableInteger = { anyOf: [{ type: "integer" }, { type: "null" }] };
const nullableBoolean = { anyOf: [{ type: "boolean" }, { type: "null" }] };

const recommendationJsonSchema = {
  type: "object",
  properties: {
    constraints: {
      type: "object",
      properties: {
        excludedNumbers: { type: "array", items: { type: "integer" } },
        oddCount: nullableInteger,
        lowCount: nullableInteger,
        minNumber: nullableInteger,
        maxNumber: nullableInteger,
        allowConsecutive: nullableBoolean,
      },
      required: [
        "excludedNumbers",
        "oddCount",
        "lowCount",
        "minNumber",
        "maxNumber",
        "allowConsecutive",
      ],
      additionalProperties: false,
    },
    unsupportedConditions: { type: "array", items: { type: "string" } },
    explanation: { type: "string" },
  },
  required: ["constraints", "unsupportedConditions", "explanation"],
  additionalProperties: false,
};

const GroqResponseSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
});

export async function getGroqRecommendation({
  prompt,
  fixedNumbers,
  analysisSummary,
}: GroqRecommendationInput): Promise<GroqRecommendation> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    throw new GroqProviderError(
      "configuration",
      "Groq API key is not configured",
    );

  let response: Response;
  let result: GroqRecommendation;
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
              "사용자의 로또 번호 조건은 지원하는 제약만으로 해석하세요: excludedNumbers, oddCount, lowCount(1~22), minNumber, maxNumber, allowConsecutive. 지정하지 않은 단일 조건은 null, 제외 번호가 없으면 []를 사용하세요. 정확히 적용할 수 없는 조건은 unsupportedConditions에 적으세요. 당첨 번호를 지어내거나 예측하지 마세요. 아직 조합이 생성되기 전이므로 특정 조합이 아닌 전체 추천에 적용한 통계 기준을 한두 문장으로 설명하세요. 당첨 확률이 높아진다고 주장하지 마세요. JSON의 사용자에게 보이는 모든 문구, 즉 unsupportedConditions의 각 항목과 explanation은 반드시 자연스러운 한국어로 작성하세요. 사용자가 다른 언어로 요청해도 이 규칙이 우선합니다. 영문 단어, 영문 알파벳, 로마자 표기를 포함하지 마세요. 영어 조건은 그대로 인용하지 말고 뜻을 한국어로 바꿔 적으세요. JSON 스키마를 지켜 응답하세요.",
          },
          {
            role: "user",
            content: JSON.stringify({
              prompt: prompt ?? "",
              fixedNumbers,
              analysisSummary,
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lottery_generation_recommendation",
            strict: true,
            schema: recommendationJsonSchema,
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
      throw new GroqProviderError(
        "timeout",
        "Groq request timed out; try again",
      );
    }
    throw new GroqProviderError("upstream", "Groq request failed; try again");
  }

  if (response.status === 429) {
    throw new GroqProviderError(
      "rate-limit",
      "Groq rate limit exceeded; try again later",
    );
  }
  if (!response.ok) {
    throw new GroqProviderError("upstream", "Groq request failed; try again");
  }

  try {
    const envelope = GroqResponseSchema.parse(await response.json());
    const parsed = RecommendationSchema.parse(
      JSON.parse(envelope.choices[0].message.content),
    );
    const rawConstraints = parsed.constraints;
    const constraints = GenerationConstraintsSchema.parse({
      excludedNumbers: rawConstraints.excludedNumbers,
      ...(rawConstraints.oddCount !== null && {
        oddCount: rawConstraints.oddCount,
      }),
      ...(rawConstraints.lowCount !== null && {
        lowCount: rawConstraints.lowCount,
      }),
      ...(rawConstraints.minNumber !== null && {
        minNumber: rawConstraints.minNumber,
      }),
      ...(rawConstraints.maxNumber !== null && {
        maxNumber: rawConstraints.maxNumber,
      }),
      ...(rawConstraints.allowConsecutive !== null && {
        allowConsecutive: rawConstraints.allowConsecutive,
      }),
    });
    result = {
      constraints,
      unsupportedConditions: parsed.unsupportedConditions,
      explanation: parsed.explanation,
    };
  } catch {
    throw new GroqProviderError(
      "invalid-response",
      "Invalid Groq recommendation",
    );
  }

  validateFixedNumberCompatibility(result.constraints, fixedNumbers);
  return result;
}

function validateFixedNumberCompatibility(
  constraints: GenerationConstraints,
  fixedNumbers: readonly number[],
): void {
  if (
    fixedNumbers.some((number) => constraints.excludedNumbers?.includes(number))
  ) {
    throw new Error(
      "AI 조건과 고정 번호가 충돌합니다: 제외 번호를 확인해 주세요.",
    );
  }
  if (
    fixedNumbers.some(
      (number) =>
        number < (constraints.minNumber ?? 1) ||
        number > (constraints.maxNumber ?? 45),
    )
  ) {
    throw new Error(
      "AI 조건과 고정 번호가 충돌합니다: 번호 범위를 확인해 주세요.",
    );
  }

  const remainingSlots = 6 - fixedNumbers.length;
  const oddFixed = fixedNumbers.filter((number) => number % 2 === 1).length;
  if (
    constraints.oddCount !== undefined &&
    (oddFixed > constraints.oddCount ||
      oddFixed + remainingSlots < constraints.oddCount)
  ) {
    throw new Error(
      "AI 조건과 고정 번호가 충돌합니다: 홀수 개수를 확인해 주세요.",
    );
  }
  const lowFixed = fixedNumbers.filter((number) => number <= 22).length;
  if (
    constraints.lowCount !== undefined &&
    (lowFixed > constraints.lowCount ||
      lowFixed + remainingSlots < constraints.lowCount)
  ) {
    throw new Error(
      "AI 조건과 고정 번호가 충돌합니다: 낮은 번호 개수를 확인해 주세요.",
    );
  }
  if (
    constraints.allowConsecutive === false &&
    fixedNumbers.some((number) => fixedNumbers.includes(number + 1))
  ) {
    throw new Error(
      "AI 조건과 고정 번호가 충돌합니다: 연속 번호를 확인해 주세요.",
    );
  }
}
