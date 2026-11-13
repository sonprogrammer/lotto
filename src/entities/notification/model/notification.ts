import { z } from "zod";

export const NotificationSchema = z.object({
  id: z.string(),
  savedCombinationId: z.string(),
  roundNumber: z.number().int().positive(),
  drawDate: z.string(),
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
  readAt: z.string().nullable(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPage = {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
