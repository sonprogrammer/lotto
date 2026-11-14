import { z } from "zod";

export const SajuProfileInputSchema = z
  .object({
    displayName: z.string().trim().min(1).max(30).optional(),
    birthDate: z.iso.date(),
    calendarType: z.enum(["solar", "lunar"]),
    isLeapMonth: z.boolean().optional(),
    birthTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
  })
  .refine(
    (profile) =>
      profile.calendarType === "lunar" || profile.isLeapMonth !== true,
    {
      message: "Leap month can only be selected for a lunar birth date",
      path: ["isLeapMonth"],
    },
  );

export const SajuProfileSchema = SajuProfileInputSchema.extend({
  createdAt: z.date(),
  updatedAt: z.date(),
}).refine((profile) => profile.updatedAt >= profile.createdAt, {
  message: "updatedAt must be equal to or later than createdAt",
  path: ["updatedAt"],
});

export type SajuProfileInput = z.infer<typeof SajuProfileInputSchema>;
export type SajuProfile = z.infer<typeof SajuProfileSchema>;
