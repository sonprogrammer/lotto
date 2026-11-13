import type { SavedPromptDocument } from "../model/document";
import { SavedPromptSchema } from "../model/prompt";

export function serializeSavedPrompt(document: SavedPromptDocument) {
  return SavedPromptSchema.parse({
    id: document._id.toHexString(),
    title: document.title,
    content: document.content,
    sortOrder: document.sortOrder,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  });
}
