import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { expect, it } from "vitest";
import { useGenerationForm } from "./use-generation-form";

const prompt = {
  id: "65ab12cd34ef56ab78cd9001",
  title: "균형 조합",
  content: "홀짝을 고려해 주세요.",
  sortOrder: 0,
  createdAt: "2026-11-08T00:00:00.000Z",
  updatedAt: "2026-11-08T00:00:00.000Z",
};

function createWrapper() {
  const queryClient = new QueryClient();
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

it("returns to the default prompt when the selected saved prompt is deleted", async () => {
  const { result, rerender } = renderHook(
    ({ savedPrompts }) => useGenerationForm(savedPrompts),
    { initialProps: { savedPrompts: [prompt] }, wrapper: createWrapper() },
  );

  act(() => {
    result.current.changePromptMode("saved");
    result.current.changeSavedPromptId(prompt.id);
  });
  expect(result.current.canSubmit).toBe(true);

  rerender({ savedPrompts: [] });

  await waitFor(() => {
    expect(result.current.promptMode).toBe("default");
    expect(result.current.savedPromptId).toBe("");
  });
  expect(result.current.canSubmit).toBe(true);
});
