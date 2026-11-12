import { z } from "zod";
import type { WeeklyAnalysis } from "@/features/analysis/lib/calculate-weekly-analysis";
import {
  GenerationConstraintsSchema,
  type GenerationConstraints,
} from "@/features/generation/lib/generate-combinations";

const LotteryNumberSchema = z.number().int().min(1).max(45);
const RecommendationSchema = z.strictObject({
  constraints: z.strictObject({
    excludedNumbers: z.array(LotteryNumberSchema).max(45),
    oddCount: z.number().int().min(0).max(6).nullable(),
    lowCount: z.number().int().min(0).max(6).nullable(),
    minNumber: LotteryNumberSchema.nullable(),
    maxNumber: LotteryNumberSchema.nullable(),
    allowConsecutive: z.boolean().nullable(),
  }),
  unsupportedConditions: z.array(z.string().trim().min(1).max(200)).max(20),
  explanation: z
    .string()
    .trim()
    .min(1)
    .max(400)
    .refine((value) => value.split(/\r?\n/).length <= 2),
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
  if (!apiKey) throw new Error("Groq API key is not configured");

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
              "Interpret the user's lottery number preferences only as supported constraints: excludedNumbers, oddCount, lowCount (numbers 1-22), minNumber, maxNumber, allowConsecutive. Use null for an unspecified scalar condition and [] for no exclusions. Put conditions you cannot express exactly in unsupportedConditions. Do not invent or predict winning numbers. Explain the statistical criteria for the whole batch in one or two short lines, without describing any specific generated combination (none has been computed yet). Never claim better winning odds. Return JSON matching the schema.",
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
      throw new Error("Groq request timed out; try again");
    }
    throw new Error("Groq request failed; try again");
  }

  if (response.status === 429) {
    throw new Error("Groq rate limit exceeded; try again later");
  }
  if (!response.ok) {
    throw new Error("Groq request failed; try again");
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
    throw new Error("Invalid Groq recommendation");
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
