import { getKakaoConfig } from "./config";

export function getKakaoOrigin(requestUrl: URL): string {
  if (process.env.VERCEL_ENV === "preview") {
    const branchUrl = process.env.VERCEL_BRANCH_URL;
    if (!branchUrl) throw new Error("Vercel branch URL is not configured");
    return `https://${branchUrl}`;
  }

  if (process.env.VERCEL_ENV === "production") {
    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (!productionUrl) {
      throw new Error("Vercel production URL is not configured");
    }
    return `https://${productionUrl}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Vercel environment is not configured");
  }

  return requestUrl.origin;
}

export function getKakaoRedirectUri(requestUrl: URL): string {
  const origin = getKakaoOrigin(requestUrl);
  return new URL(getKakaoConfig().redirectUri, origin).toString();
}
