import {
  createSimulationForUser,
  SimulationInputError,
} from "@/features/simulation/server/create-simulation";
import { listSimulationRuns } from "@/entities/simulation/server/simulation-store";
import { SimulationRequestSchema } from "@/features/simulation/model/simulation-request";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { privateJson } from "@/shared/server/http/private-json";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);

  try {
    return privateJson(await listSimulationRuns(user.userId, 20));
  } catch {
    return privateJson(
      { error: "시뮬레이션 기록을 불러오지 못했어요.", retryable: true },
      502,
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return privateJson({ error: "로그인이 필요해요." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "시뮬레이션 설정을 확인해 주세요." }, 400);
  }
  const parsed = SimulationRequestSchema.safeParse(body);
  if (!parsed.success)
    return privateJson({ error: "조합 개수는 1~10개로 설정해 주세요." }, 400);

  try {
    return privateJson(
      await createSimulationForUser(
        user.userId,
        parsed.data.combinationsPerRound,
      ),
      201,
    );
  } catch (error) {
    if (
      error instanceof SimulationInputError &&
      error.message === "At least 60 completed rounds are required"
    ) {
      return privateJson(
        {
          error: "시뮬레이션하려면 최소 60회차의 당첨 자료가 필요해요.",
          retryable: false,
        },
        400,
      );
    }
    if (
      error instanceof SimulationInputError &&
      error.message === "Simulation draw history must be continuous"
    ) {
      return privateJson(
        {
          error: "당첨 회차 자료에 누락이 있어 시뮬레이션할 수 없어요.",
          retryable: false,
        },
        400,
      );
    }
    return privateJson(
      {
        error: "시뮬레이션을 실행하지 못했어요. 다시 시도해 주세요.",
        retryable: true,
      },
      502,
    );
  }
}
