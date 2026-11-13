"use client";

import { useState, type FormEvent } from "react";
import type { SavedPrompt } from "@/entities/saved-prompt/model/prompt";
import { useGenerateCombinations } from "./use-generate-combinations";

export type GenerationPromptMode = "default" | "saved" | "custom";

export function useGenerationForm(savedPrompts: SavedPrompt[] = []) {
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [count, setCount] = useState(5);
  const [periodChoice, setPeriodChoice] = useState("recent:30");
  const [customCount, setCustomCount] = useState("");
  const [prompt, setPrompt] = useState("");
  const [promptMode, setPromptMode] = useState<GenerationPromptMode>("default");
  const [savedPromptId, setSavedPromptId] = useState("");
  const generation = useGenerateCombinations();
  const selectedSavedPrompt = savedPrompts.find(
    (savedPrompt) => savedPrompt.id === savedPromptId,
  );
  const activePromptMode =
    savedPromptId && !selectedSavedPrompt ? "default" : promptMode;
  const activeSavedPromptId = selectedSavedPrompt ? savedPromptId : "";
  const customPeriodValid =
    /^[1-9]\d*$/.test(customCount) && Number.isSafeInteger(Number(customCount));
  const countValid = fixedNumbers.length !== 6 || count === 1;
  const canSubmit =
    !generation.isPending &&
    countValid &&
    (periodChoice !== "custom" || customPeriodValid) &&
    (activePromptMode !== "saved" || Boolean(selectedSavedPrompt));

  function toggleNumber(number: number) {
    if (generation.isPending) return;
    setFixedNumbers((current) =>
      current.includes(number)
        ? current.filter((item) => item !== number)
        : current.length < 6
          ? [...current, number].sort((left, right) => left - right)
          : current,
    );
    generation.reset();
  }

  function changeCount(value: number) {
    if (generation.isPending) return;
    setCount(value);
    generation.reset();
  }
  function changePeriodChoice(value: string) {
    if (generation.isPending) return;
    setPeriodChoice(value);
    generation.reset();
  }
  function changeCustomCount(value: string) {
    if (generation.isPending) return;
    setCustomCount(value);
    generation.reset();
  }
  function changePrompt(value: string) {
    if (generation.isPending) return;
    setPrompt(value);
    generation.reset();
  }
  function changePromptMode(value: GenerationPromptMode) {
    if (generation.isPending) return;
    setPromptMode(value);
    generation.reset();
  }
  function changeSavedPromptId(value: string) {
    if (generation.isPending) return;
    setSavedPromptId(value);
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
    const activePrompt =
      activePromptMode === "saved"
        ? selectedSavedPrompt?.content
        : activePromptMode === "custom"
          ? prompt.trim()
          : undefined;

    generation.mutate({
      fixedNumbers,
      count,
      period,
      ...(activePrompt ? { prompt: activePrompt } : {}),
    });
  }

  function retry() {
    if (generation.variables && !generation.isPending)
      generation.mutate(generation.variables);
  }

  return {
    fixedNumbers,
    count,
    periodChoice,
    customCount,
    prompt,
    promptMode: activePromptMode,
    savedPromptId: activeSavedPromptId,
    generation,
    customPeriodValid,
    countValid,
    canSubmit,
    toggleNumber,
    changeCount,
    changePeriodChoice,
    changeCustomCount,
    changePrompt,
    changePromptMode,
    changeSavedPromptId,
    submit,
    retry,
  };
}
