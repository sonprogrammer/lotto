export function savedPromptsQueryKey(userId: string) {
  return ["saved-prompts", userId] as const;
}
