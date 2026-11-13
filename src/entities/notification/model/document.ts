import { ObjectId } from "mongodb";
import { z } from "zod";

const ObjectIdSchema = z.instanceof(ObjectId);
const UserIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export const NotificationDocumentSchema = z
  .object({
    _id: ObjectIdSchema,
    userId: UserIdSchema,
    savedCombinationId: ObjectIdSchema,
    roundNumber: z.number().int().positive(),
    drawDate: z.date(),
    status: z.enum(["won", "corrected"]),
    rank: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ])
      .nullable(),
    amountPerWinner: z.number().int().nonnegative(),
    readAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((notification, context) => {
    if (notification.status === "won" && notification.rank === null)
      context.addIssue({
        code: "custom",
        message: "Won notification needs a rank",
        path: ["rank"],
      });
    if (
      notification.status === "corrected" &&
      (notification.rank !== null || notification.amountPerWinner !== 0)
    )
      context.addIssue({
        code: "custom",
        message: "Corrected notification must clear prize",
        path: ["status"],
      });
  });

export const PushSubscriptionDocumentSchema = z.object({
  _id: ObjectIdSchema,
  userId: UserIdSchema,
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  userAgent: z.string().nullable(),
  lastUsedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PushDeliveryDocumentSchema = z.object({
  _id: ObjectIdSchema,
  userId: UserIdSchema,
  notificationId: ObjectIdSchema,
  subscriptionId: ObjectIdSchema,
  status: z.enum(["pending", "attempted", "sent", "failed"]),
  attemptedAt: z.date().nullable(),
  sentAt: z.date().nullable(),
  failureCode: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationDocument = z.infer<typeof NotificationDocumentSchema>;
export type PushSubscriptionDocument = z.infer<
  typeof PushSubscriptionDocumentSchema
>;
export type PushDeliveryDocument = z.infer<typeof PushDeliveryDocumentSchema>;
