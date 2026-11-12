import { ObjectId } from "mongodb";
import { z } from "zod";
import { LottoNumbersSchema } from "@/entities/lottery-draw/model/document";

export const SavedCombinationDocumentSchema = z.object({
  _id: z.instanceof(ObjectId),
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  targetRound: z.number().int().positive(),
  numbers: LottoNumbersSchema,
  analysisSummary: z.string().trim().min(1),
  createdAt: z.date(),
});

export type SavedCombinationDocument = z.infer<
  typeof SavedCombinationDocumentSchema
>;
