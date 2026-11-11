import { ObjectId } from "mongodb";
import { z } from "zod";

export const SavedPromptDocumentSchema = z
  .object({
    _id: z.instanceof(ObjectId),
    userId: z.string().regex(/^[a-f\d]{24}$/i),
    prompt: z.string().trim().min(1),
    sortOrder: z.number().int().nonnegative(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((prompt) => prompt.updatedAt >= prompt.createdAt, {
    message: "updatedAt must be equal to or later than createdAt",
    path: ["updatedAt"],
  });

export type SavedPromptDocument = z.infer<typeof SavedPromptDocumentSchema>;
