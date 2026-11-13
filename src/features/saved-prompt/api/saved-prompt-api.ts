import type {
  SavedPromptCreate,
  SavedPromptUpdate,
} from "@/entities/saved-prompt/model/input";
import type { SavedPrompt } from "@/entities/saved-prompt/model/prompt";

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error || "프롬프트 요청을 처리하지 못했어요.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function fetchSavedPrompts(): Promise<SavedPrompt[]> {
  return readResponse(await fetch("/api/saved-prompts"));
}

export async function createSavedPromptRequest(
  input: SavedPromptCreate,
): Promise<SavedPrompt> {
  return readResponse(
    await fetch("/api/saved-prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateSavedPromptRequest(
  id: string,
  input: SavedPromptUpdate,
): Promise<SavedPrompt> {
  return readResponse(
    await fetch(`/api/saved-prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteSavedPromptRequest(id: string): Promise<void> {
  return readResponse(
    await fetch(`/api/saved-prompts/${id}`, { method: "DELETE" }),
  );
}
