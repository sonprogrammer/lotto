import { z } from "zod";
import { LottoNumbersSchema } from "@/entities/lottery-draw/model/document";

const SummarySchema = z.string().trim().min(1).max(500);
const BaseSchema = z.object({ numbers: LottoNumbersSchema });

export const SavedCombinationCreateSchema = z.discriminatedUnion("source", [
  BaseSchema.extend({ source: z.literal("manual") }),
  BaseSchema.extend({
    source: z.literal("ai-assisted"),
    analysisSummary: SummarySchema,
  }),
]);

export const SavedCombinationUpdateSchema = z.object({
  numbers: LottoNumbersSchema,
});
export const SavedCombinationIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const SavedCombinationDeleteSchema = z.union([
  z.object({ ids: z.array(SavedCombinationIdSchema).min(1) }),
  z.object({ all: z.literal(true) }),
]);

export type SavedCombinationCreate = z.infer<
  typeof SavedCombinationCreateSchema
>;
export type SavedCombinationUpdate = z.infer<
  typeof SavedCombinationUpdateSchema
>;
export type SavedCombinationDelete = z.infer<
  typeof SavedCombinationDeleteSchema
>;
