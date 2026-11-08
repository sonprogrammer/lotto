import { getMongoDb } from "@/shared/server/mongodb/client";

type KakaoUser = { kakaoId: string; createdAt: Date };

export async function findOrCreateKakaoUser(
  kakaoId: string,
): Promise<{ userId: string }> {
  const collection = (await getMongoDb()).collection<KakaoUser>("users");
  await collection.createIndex({ kakaoId: 1 }, { unique: true });
  let user;
  try {
    user = await collection.findOneAndUpdate(
      { kakaoId },
      { $setOnInsert: { kakaoId, createdAt: new Date() } },
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
