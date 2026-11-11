import { ObjectId } from "mongodb";
import { z } from "zod";

const objectIdHexSchema = z.string().regex(/^[a-f\d]{24}$/i);
const tokenHashSchema = z.string().regex(/^[a-f\d]{64}$/i);

export const AppSessionDocumentSchema = z
  .object({
    _id: z.instanceof(ObjectId).optional(),
    userId: objectIdHexSchema,
    tokenHash: tokenHashSchema,
    createdAt: z.date(),
    expiresAt: z.date(),
  })
  .refine((session) => session.expiresAt > session.createdAt, {
    message: "expiresAt must be later than createdAt",
    path: ["expiresAt"],
  });

export type AppSessionDocument = z.infer<typeof AppSessionDocumentSchema>;
