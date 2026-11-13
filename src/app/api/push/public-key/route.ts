import { getVapidConfig } from "@/entities/notification/server/vapid-config";
import { privateJson } from "@/shared/server/http/private-json";

export async function GET() {
  const config = getVapidConfig();
  if (!config)
    return privateJson({ error: "푸시 알림 설정이 준비되지 않았어요." }, 503);
  return privateJson({ publicKey: config.publicKey });
}
