"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedPromptCreate } from "@/entities/saved-prompt/model/input";
import { createSavedPromptRequest } from "../api/saved-prompt-api";
import { savedPromptsQueryKey } from "../model/query-key";

export function useCreateSavedPrompt(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavedPromptCreate) => createSavedPromptRequest(input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: savedPromptsQueryKey(userId) }),
  });
}
