import { getMongoDb } from "@/shared/server/mongodb/client";
import { ObjectId } from "mongodb";

type KakaoUser = { kakaoId: string; nickname: string; createdAt: Date };

export async function findOrCreateKakaoUser(
  kakaoId: string,
  nickname: string,
): Promise<{ userId: string }> {
  const collection = (await getMongoDb()).collection<KakaoUser>("users");
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
  return { userId: user._id.toHexString() };
}

export async function findKakaoUserById(
  userId: string,
): Promise<{ nickname: string } | null> {
  if (!ObjectId.isValid(userId)) return null;
  const user = await (
    await getMongoDb()
  )
    .collection<KakaoUser>("users")
    .findOne({ _id: new ObjectId(userId) });
  return user?.nickname ? { nickname: user.nickname } : null;
}
