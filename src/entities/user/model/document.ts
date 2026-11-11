import { ObjectId } from "mongodb";
import { z } from "zod";

export const KakaoUserDocumentSchema = z.object({
  _id: z.instanceof(ObjectId),
  kakaoId: z.string().trim().min(1),
  nickname: z.string().trim().min(1).optional(),
  createdAt: z.date(),
});

export type KakaoUserDocument = z.infer<typeof KakaoUserDocumentSchema>;
