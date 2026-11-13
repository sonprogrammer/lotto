import type {
  SimulationRun,
  SimulationRunSummary,
} from "@/entities/simulation";

type ErrorResponsePayload = { error?: string; retryable?: boolean };

export class SimulationApiError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "SimulationApiError";
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const apiError =
      typeof body === "object" && body !== null && "error" in body
        ? (body as ErrorResponsePayload)
        : undefined;
    throw new SimulationApiError(
      apiError?.error ? apiError.error : "시뮬레이션 요청을 처리하지 못했어요.",
      apiError?.retryable ?? response.status >= 500,
    );
  }
  return body as T;
}

export async function fetchSimulationRuns(): Promise<SimulationRunSummary[]> {
  const response = await fetch("/api/simulations", { cache: "no-store" });
  return readResponse(response);
}

export async function fetchSimulationRun(id: string): Promise<SimulationRun> {
  const response = await fetch(`/api/simulations/${id}`, { cache: "no-store" });
  return readResponse(response);
}

export async function createSimulation(
  combinationsPerRound: number,
): Promise<SimulationRun> {
  const response = await fetch("/api/simulations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ combinationsPerRound }),
  });
  return readResponse(response);
}
