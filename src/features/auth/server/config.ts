import { z } from "zod";

export { getMongoConfig } from "@/shared/server/mongodb/config";

const kakaoConfigSchema = z.object({
  restApiKey: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
  redirectUri: z.url({ protocol: /^https?$/ }),
});

export function getKakaoConfig(): {
  restApiKey: string;
  clientSecret: string;
  redirectUri: string;
} {
  const result = kakaoConfigSchema.safeParse({
    restApiKey: process.env.KAKAO_REST_API_KEY,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    redirectUri: process.env.KAKAO_REDIRECT_URI,
  });
  if (!result.success)
    throw new Error("Kakao authentication is not configured");
  return result.data;
}
