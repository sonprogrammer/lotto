import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  SAVED_PROMPT_CONTENT_MAX_LENGTH,
  SAVED_PROMPT_TITLE_MAX_LENGTH,
} from "./limits";

export const SavedPromptDocumentSchema = z
  .object({
    _id: z.instanceof(ObjectId),
    userId: z.string().regex(/^[a-f\d]{24}$/i),
    title: z.string().trim().min(1).max(SAVED_PROMPT_TITLE_MAX_LENGTH),
    content: z.string().trim().min(1).max(SAVED_PROMPT_CONTENT_MAX_LENGTH),
    sortOrder: z.number().int().min(0).max(4),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((prompt) => prompt.updatedAt >= prompt.createdAt, {
    message: "updatedAt must be equal to or later than createdAt",
    path: ["updatedAt"],
  });

export type SavedPromptDocument = z.infer<typeof SavedPromptDocumentSchema>;
