import { z } from "zod";
import {
  SAVED_PROMPT_CONTENT_MAX_LENGTH,
  SAVED_PROMPT_TITLE_MAX_LENGTH,
} from "./limits";

const TitleSchema = z
  .string()
  .trim()
  .min(1, "제목을 입력해 주세요.")
  .max(SAVED_PROMPT_TITLE_MAX_LENGTH, "제목은 30자까지 입력할 수 있어요.");

const ContentSchema = z
  .string()
  .trim()
  .min(1, "내용을 입력해 주세요.")
  .max(SAVED_PROMPT_CONTENT_MAX_LENGTH, "내용은 300자까지 입력할 수 있어요.");

export const SavedPromptCreateSchema = z.object({
  title: TitleSchema,
  content: ContentSchema,
});

export const SavedPromptUpdateSchema = z
  .object({
    title: TitleSchema.optional(),
    content: ContentSchema.optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "수정할 내용을 입력해 주세요.",
  });

export const SavedPromptIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export type SavedPromptCreate = z.infer<typeof SavedPromptCreateSchema>;
export type SavedPromptUpdate = z.infer<typeof SavedPromptUpdateSchema>;
