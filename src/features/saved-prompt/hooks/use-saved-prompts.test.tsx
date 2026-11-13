import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import {
  useCreateSavedPrompt,
  useDeleteSavedPrompt,
  useSavedPrompts,
  useUpdateSavedPrompt,
} from "./index";

const userId = "65ab12cd34ef56ab78cd90ef";
const savedPrompt = {
  id: "65ab12cd34ef56ab78cd9001",
  title: "균형 조합",
  content: "홀짝을 고려해 주세요.",
  sortOrder: 0,
  createdAt: "2026-11-08T00:00:00.000Z",
  updatedAt: "2026-11-08T00:00:00.000Z",
};
const fetchMock = vi.fn();

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(jsonResponse([savedPrompt]));
});

it("loads prompts into a cache scoped to the signed-in user", async () => {
  const queryClient = createClient();
  const { result } = renderHook(() => useSavedPrompts(userId), {
    wrapper: createWrapper(queryClient),
  });

  await waitFor(() => expect(result.current.data).toEqual([savedPrompt]));

  expect(fetchMock).toHaveBeenCalledWith("/api/saved-prompts");
  expect(queryClient.getQueryData(["saved-prompts", userId])).toEqual([
    savedPrompt,
  ]);
  expect(queryClient.getQueryData(["saved-prompts", "another-user"])).toBe(
    undefined,
  );
});

it("creates a prompt and invalidates only that user's saved prompt cache", async () => {
  fetchMock.mockResolvedValue(jsonResponse(savedPrompt, 201));
  const queryClient = createClient();
  queryClient.setQueryData(["saved-prompts", userId], [savedPrompt]);
  queryClient.setQueryData(["saved-prompts", "another-user"], [savedPrompt]);
  const { result } = renderHook(() => useCreateSavedPrompt(userId), {
    wrapper: createWrapper(queryClient),
  });

  await act(async () => {
    await result.current.mutateAsync({ title: "새 프롬프트", content: "내용" });
  });

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/saved-prompts",
    expect.objectContaining({ method: "POST" }),
  );
  expect(
    queryClient.getQueryState(["saved-prompts", userId])?.isInvalidated,
  ).toBe(true);
  expect(
    queryClient.getQueryState(["saved-prompts", "another-user"])?.isInvalidated,
  ).toBe(false);
});

it("invalidates the user's list after a failed save to refresh cross-device changes", async () => {
  fetchMock.mockResolvedValue(
    jsonResponse({ error: "프롬프트는 최대 5개까지 저장할 수 있어요." }, 409),
  );
  const queryClient = createClient();
  queryClient.setQueryData(["saved-prompts", userId], [savedPrompt]);
  const { result } = renderHook(() => useCreateSavedPrompt(userId), {
    wrapper: createWrapper(queryClient),
  });

  await act(async () => {
    await expect(
      result.current.mutateAsync({ title: "새 프롬프트", content: "내용" }),
    ).rejects.toThrow("프롬프트는 최대 5개까지 저장할 수 있어요.");
  });

  expect(
    queryClient.getQueryState(["saved-prompts", userId])?.isInvalidated,
  ).toBe(true);
});

it("updates and deletes prompts through their own mutation endpoints", async () => {
  const queryClient = createClient();
  const update = renderHook(() => useUpdateSavedPrompt(userId), {
    wrapper: createWrapper(queryClient),
  });
  await act(async () => {
    await update.result.current.mutateAsync({
      id: savedPrompt.id,
      input: { title: "수정된 제목" },
    });
  });
  expect(fetchMock).toHaveBeenLastCalledWith(
    `/api/saved-prompts/${savedPrompt.id}`,
    expect.objectContaining({ method: "PATCH" }),
  );

  fetchMock.mockResolvedValue({ ok: true, status: 204 });
  const remove = renderHook(() => useDeleteSavedPrompt(userId), {
    wrapper: createWrapper(queryClient),
  });
  await act(async () => {
    await remove.result.current.mutateAsync(savedPrompt.id);
  });
  expect(fetchMock).toHaveBeenLastCalledWith(
    `/api/saved-prompts/${savedPrompt.id}`,
    expect.objectContaining({ method: "DELETE" }),
  );
});
