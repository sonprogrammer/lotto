"use client";

import { useState, type FormEvent } from "react";
import type { GenerationRequest } from "../model/generation-request";
import { useGenerateCombinations } from "./use-generate-combinations";

type Method = GenerationRequest["method"];

export function useGenerationForm() {
  const [method, setMethod] = useState<Method>("automatic");
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [count, setCount] = useState(5);
  const [periodChoice, setPeriodChoice] = useState("recent:30");
  const [customCount, setCustomCount] = useState("");
  const [prompt, setPrompt] = useState("");
  const generation = useGenerateCombinations();
  const customPeriodValid =
    /^[1-9]\d*$/.test(customCount) && Number.isSafeInteger(Number(customCount));
  const fixedValid =
    method === "automatic" ||
    (method === "selected"
      ? fixedNumbers.length > 0
      : fixedNumbers.length > 0 && fixedNumbers.length <= 5);
  const countValid = fixedNumbers.length !== 6 || count === 1;
  const canSubmit =
    !generation.isPending &&
    fixedValid &&
    countValid &&
    (periodChoice !== "custom" || customPeriodValid);

  function changeMethod(next: Method) {
    setMethod(next);
    setFixedNumbers([]);
    generation.reset();
  }

  function toggleNumber(number: number) {
    setFixedNumbers((current) =>
      current.includes(number)
        ? current.filter((item) => item !== number)
        : current.length < (method === "ai-assisted" ? 5 : 6)
          ? [...current, number].sort((left, right) => left - right)
          : current,
    );
    generation.reset();
  }

  function changeCount(value: number) {
    setCount(value);
    generation.reset();
  }
  function changePeriodChoice(value: string) {
    setPeriodChoice(value);
    generation.reset();
  }
  function changeCustomCount(value: string) {
    setCustomCount(value);
    generation.reset();
  }
  function changePrompt(value: string) {
    setPrompt(value);
    generation.reset();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const period =
      periodChoice === "all"
        ? { type: "all" as const }
        : {
            type: "recent" as const,
            count:
              periodChoice === "custom"
                ? Number(customCount)
                : Number(periodChoice.split(":")[1]),
          };
    generation.mutate({
      method,
      fixedNumbers,
      count,
      period,
      ...(prompt.trim() ? { prompt: prompt.trim() } : {}),
    });
  }

  function retry() {
    if (generation.variables && !generation.isPending)
      generation.mutate(generation.variables);
  }

  return {
    method,
    fixedNumbers,
    count,
    periodChoice,
    customCount,
    prompt,
    generation,
    customPeriodValid,
    fixedValid,
    countValid,
    canSubmit,
    changeMethod,
    toggleNumber,
    changeCount,
    changePeriodChoice,
    changeCustomCount,
    changePrompt,
    submit,
    retry,
  };
}
