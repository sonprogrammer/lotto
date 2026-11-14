import { z } from "zod";

const PillarSchema = z.string().regex(/^\p{Script=Hangul}{2}$/u);

export const SajuAiContextSchema = z.strictObject({
  birthPillars: z.strictObject({
    year: PillarSchema,
    month: PillarSchema,
    day: PillarSchema,
    hour: PillarSchema.optional(),
  }),
  today: z.strictObject({
    dateKey: z.iso.date(),
    dayPillar: PillarSchema,
  }),
});

export type SajuAiContext = z.infer<typeof SajuAiContextSchema>;
