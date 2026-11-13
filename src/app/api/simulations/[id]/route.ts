import { getSimulationRun } from "@/entities/simulation/server/simulation-store";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { privateJson } from "@/shared/server/http/private-json";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);

  const { id } = await context.params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return privateJson({ error: "시뮬레이션 기록을 찾을 수 없어요." }, 400);

  try {
    const run = await getSimulationRun(user.userId, id);
    if (!run)
      return privateJson({ error: "시뮬레이션 기록을 찾을 수 없어요." }, 404);
    return privateJson(run);
  } catch {
    return privateJson(
      { error: "시뮬레이션 기록을 불러오지 못했어요.", retryable: true },
      502,
    );
  }
}
