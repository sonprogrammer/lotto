import type { SavedCombination } from "@/entities/saved-combination/model/combination";
import type { SavedCombinationCreate } from "@/entities/saved-combination/model/input";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "요청을 처리하지 못했어요.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const fetchSavedCombinations = () =>
  request<SavedCombination[]>("/api/saved-combinations");
export const createSavedCombinationRequest = (input: SavedCombinationCreate) =>
  request<SavedCombination>("/api/saved-combinations", {
    method: "POST",
    body: JSON.stringify(input),
  });
export const updateSavedCombinationRequest = (id: string, numbers: number[]) =>
  request<SavedCombination>(`/api/saved-combinations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ numbers }),
  });
export const deleteSavedCombinationRequest = (id: string) =>
  request<void>(`/api/saved-combinations/${id}`, { method: "DELETE" });
export const deleteSavedCombinationsRequest = (
  body: { ids: string[] } | { all: true },
) =>
  request<void>("/api/saved-combinations", {
    method: "DELETE",
    body: JSON.stringify(body),
  });
