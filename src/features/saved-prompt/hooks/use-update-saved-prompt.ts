"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedPromptUpdate } from "@/entities/saved-prompt/model/input";
import { updateSavedPromptRequest } from "../api/saved-prompt-api";
import { savedPromptsQueryKey } from "../model/query-key";

export function useUpdateSavedPrompt(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SavedPromptUpdate }) =>
      updateSavedPromptRequest(id, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: savedPromptsQueryKey(userId) }),
  });
}
