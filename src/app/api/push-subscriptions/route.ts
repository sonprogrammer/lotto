import { z } from "zod";
import {
  deletePushSubscription,
  upsertPushSubscription,
} from "@/entities/notification";
import { getCurrentUser } from "@/features/auth/server/current-session";
import {
  privateJson,
  privateNoContent,
} from "@/shared/server/http/private-json";

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  userAgent: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  const parsed = SubscriptionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return privateJson({ error: "알림 구독 정보를 확인해 주세요." }, 400);
  try {
    await upsertPushSubscription(user.userId, parsed.data);
    return privateNoContent();
  } catch {
    return privateJson({ error: "알림을 켜지 못했어요." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);
  const parsed = z
    .object({ endpoint: z.string().url() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return privateJson({ error: "알림 구독 정보를 확인해 주세요." }, 400);
  try {
    await deletePushSubscription(user.userId, parsed.data.endpoint);
    return privateNoContent();
  } catch {
    return privateJson({ error: "알림을 끄지 못했어요." }, 500);
  }
}
