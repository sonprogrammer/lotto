import { z } from "zod";
import {
  SAVED_PROMPT_CONTENT_MAX_LENGTH,
  SAVED_PROMPT_TITLE_MAX_LENGTH,
} from "./limits";
import { SavedPromptIdSchema } from "./input";

export const SavedPromptSchema = z.object({
  id: SavedPromptIdSchema,
  title: z.string().min(1).max(SAVED_PROMPT_TITLE_MAX_LENGTH),
  content: z.string().min(1).max(SAVED_PROMPT_CONTENT_MAX_LENGTH),
  sortOrder: z.number().int().min(0).max(4),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SavedPrompt = z.infer<typeof SavedPromptSchema>;
