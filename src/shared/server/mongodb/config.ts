import { z } from "zod";

const mongoConfigSchema = z.object({
  uri: z
    .string()
    .trim()
    .regex(/^mongodb(?:\+srv)?:\/\/[^/\s]+(?:\/[^\s]*)?$/),
  dbName: z
    .string()
    .trim()
    .min(1)
    .max(63)
    .regex(/^[^/\\. "$*<>:|?\0]+$/),
});

export function getMongoConfig(): { uri: string; dbName: string } {
  const result = mongoConfigSchema.safeParse({
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME,
  });
  if (!result.success) throw new Error("MongoDB is not configured");
  return result.data;
}
