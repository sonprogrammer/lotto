import { createHash, randomBytes } from "node:crypto";
import { getMongoDb } from "@/shared/server/mongodb/client";
import {
  AppSessionDocumentSchema,
  type AppSessionDocument,
} from "./session-document";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

async function getSessionCollection() {
  const collection = (await getMongoDb()).collection<AppSessionDocument>(
    "appSessions",
  );
  await Promise.all([
    collection.createIndex({ tokenHash: 1 }, { unique: true }),
    collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return collection;
}

export async function createAppSession(
  userId: string,
  now = new Date(),
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const collection = await getSessionCollection();
  const session = AppSessionDocumentSchema.parse({
    userId,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
  });
  await collection.insertOne(session);
  return token;
}

export async function findActiveAppSession(
  token: string,
  now = new Date(),
): Promise<{ userId: string } | null> {
  const collection = await getSessionCollection();
  const session = await collection.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: now },
  });
  if (!session) return null;
  const validatedSession = AppSessionDocumentSchema.parse(session);
  if (validatedSession.expiresAt.getTime() <= now.getTime()) return null;
  return { userId: validatedSession.userId };
}

export async function deleteAppSession(token: string): Promise<void> {
  const collection = await getSessionCollection();
  await collection.deleteOne({ tokenHash: hashToken(token) });
}
