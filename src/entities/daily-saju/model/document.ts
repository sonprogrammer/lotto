import { ObjectId } from "mongodb";
import { z } from "zod";

const UserIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const RecommendationNumberSchema = z.number().int().min(1).max(45);
const ExplanationSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine(
    (value) => /\p{Script=Hangul}/u.test(value) && !/[A-Za-z]/.test(value),
  )
  .refine((value) => value.split(/\r?\n/).length <= 2);

export const DailySajuRecommendationDocumentSchema = z
  .object({
    _id: z.instanceof(ObjectId),
    userId: UserIdSchema,
    dateKey: z.iso.date(),
    status: z.enum(["generating", "ready"]),
    leaseExpiresAt: z.date().optional(),
    number: RecommendationNumberSchema.optional(),
    explanation: ExplanationSchema.optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((document, context) => {
    if (document.status === "generating") {
      if (!document.leaseExpiresAt) {
        context.addIssue({
          code: "custom",
          message: "Generating recommendation requires a lease expiry",
          path: ["leaseExpiresAt"],
        });
      }
      if (document.number !== undefined || document.explanation !== undefined) {
        context.addIssue({
          code: "custom",
          message: "Generating recommendation cannot contain a result",
          path: ["status"],
        });
      }
    }

    if (document.status === "ready") {
      if (document.leaseExpiresAt !== undefined) {
        context.addIssue({
          code: "custom",
          message: "Ready recommendation cannot contain a lease expiry",
          path: ["leaseExpiresAt"],
        });
      }
      if (document.number === undefined) {
        context.addIssue({
          code: "custom",
          message: "Ready recommendation requires a number",
          path: ["number"],
        });
      }
      if (document.explanation === undefined) {
        context.addIssue({
          code: "custom",
          message: "Ready recommendation requires an explanation",
          path: ["explanation"],
        });
      }
    }

    if (document.updatedAt < document.createdAt) {
      context.addIssue({
        code: "custom",
        message: "updatedAt must be equal to or later than createdAt",
        path: ["updatedAt"],
      });
    }
  });

export type DailySajuRecommendationDocument = z.infer<
  typeof DailySajuRecommendationDocumentSchema
>;
