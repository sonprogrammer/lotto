import { ObjectId } from "mongodb";
import { getMongoDb } from "@/shared/server/mongodb/client";
import {
  SajuProfileInputSchema,
  SajuProfileSchema,
  type SajuProfile,
  type SajuProfileInput,
} from "../model/saju-profile";
import type { KakaoUserDocument } from "../model/document";

export class SajuProfileUserNotFoundError extends Error {
  constructor() {
    super("Saju profile owner not found");
    this.name = "SajuProfileUserNotFoundError";
  }
}

function getUserId(userId: string): ObjectId | null {
  return ObjectId.isValid(userId) ? new ObjectId(userId) : null;
}

function getUserCollection() {
  return getMongoDb().then((database) =>
    database.collection<KakaoUserDocument>("users"),
  );
}

export async function getSajuProfile(
  userId: string,
): Promise<SajuProfile | null> {
  const objectId = getUserId(userId);
  if (!objectId) return null;

  const user = await (await getUserCollection()).findOne({ _id: objectId });
  if (!user?.sajuProfile) return null;
  return SajuProfileSchema.parse(user.sajuProfile);
}

export async function saveSajuProfile(
  userId: string,
  input: SajuProfileInput,
): Promise<SajuProfile> {
  const objectId = getUserId(userId);
  if (!objectId) throw new SajuProfileUserNotFoundError();

  const validatedInput = SajuProfileInputSchema.parse(input);
  const collection = await getUserCollection();
  const user = await collection.findOne({ _id: objectId });
  if (!user) throw new SajuProfileUserNotFoundError();

  const existing = user.sajuProfile
    ? SajuProfileSchema.parse(user.sajuProfile)
    : null;
  const now = new Date();
  const profile = SajuProfileSchema.parse({
    ...validatedInput,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  const updatedUser = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: { sajuProfile: profile } },
    { returnDocument: "after" },
  );
  if (!updatedUser?.sajuProfile) throw new SajuProfileUserNotFoundError();
  return SajuProfileSchema.parse(updatedUser.sajuProfile);
}

export async function removeSajuProfile(userId: string): Promise<boolean> {
  const objectId = getUserId(userId);
  if (!objectId) return false;
  const result = await (
    await getUserCollection()
  ).updateOne({ _id: objectId }, { $unset: { sajuProfile: "" } });
  return result.matchedCount === 1;
}
