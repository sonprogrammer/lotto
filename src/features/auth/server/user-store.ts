import { getMongoDb } from "@/shared/server/mongodb/client";
import { ObjectId } from "mongodb";
import {
  KakaoUserDocumentSchema,
  type KakaoUserDocument,
} from "@/entities/user";

export async function findOrCreateKakaoUser(
  kakaoId: string,
  nickname: string,
): Promise<{ userId: string }> {
  const collection = (await getMongoDb()).collection<KakaoUserDocument>(
    "users",
  );
  await collection.createIndex({ kakaoId: 1 }, { unique: true });
  let user;
  try {
    user = await collection.findOneAndUpdate(
      { kakaoId },
      {
        $set: { nickname },
        $setOnInsert: { kakaoId, createdAt: new Date() },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== 11000
    )
      throw error;
    user = await collection.findOne({ kakaoId });
  }
  if (!user) throw new Error("Unable to find or create Kakao user");
  const validatedUser = KakaoUserDocumentSchema.parse(user);
  if (!validatedUser.nickname)
    throw new Error("Kakao user profile is missing a nickname");
  return { userId: validatedUser._id.toHexString() };
}

export async function findKakaoUserById(
  userId: string,
): Promise<{ nickname: string } | null> {
  if (!ObjectId.isValid(userId)) return null;
  const user = await (
    await getMongoDb()
  )
    .collection<KakaoUserDocument>("users")
    .findOne({ _id: new ObjectId(userId) });
  if (!user) return null;
  const validatedUser = KakaoUserDocumentSchema.parse(user);
  return validatedUser.nickname ? { nickname: validatedUser.nickname } : null;
}
