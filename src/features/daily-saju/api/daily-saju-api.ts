import type { SajuProfile, SajuProfileInput } from "@/entities/user";

export type SajuProfileResponse = {
  profile: SajuProfile | null;
  dateKey: string;
};
export type DailySajuRecommendation = {
  id: string;
  dateKey: string;
  status: "generating" | "ready";
  number?: number;
  explanation?: string;
};

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "사주 추천 요청을 처리하지 못했어요.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function fetchSajuProfile(): Promise<SajuProfileResponse> {
  return readResponse(await fetch("/api/saju-profile"));
}

export async function saveSajuProfileRequest(
  input: SajuProfileInput,
): Promise<SajuProfile> {
  return readResponse(
    await fetch("/api/saju-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteSajuProfileRequest(): Promise<void> {
  return readResponse(await fetch("/api/saju-profile", { method: "DELETE" }));
}

export async function fetchDailySajuRecommendation(): Promise<DailySajuRecommendation> {
  return readResponse(
    await fetch("/api/daily-saju/recommendation", { method: "POST" }),
  );
}
