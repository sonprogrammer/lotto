"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSavedPromptRequest } from "../api/saved-prompt-api";
import { savedPromptsQueryKey } from "../model/query-key";

export function useDeleteSavedPrompt(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSavedPromptRequest,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: savedPromptsQueryKey(userId) }),
  });
}
