import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { SavedPromptManagerDialog } from "./saved-prompt-manager-dialog";

const userId = "65ab12cd34ef56ab78cd90ef";
const fetchMock = vi.fn();
let prompts: Array<Record<string, unknown>> = [];

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return render(
    <SavedPromptManagerDialog open userId={userId} onClose={vi.fn()} />,
    { wrapper: Wrapper },
  );
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

beforeEach(() => {
  prompts = [];
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "GET") return jsonResponse(prompts);
    if (method === "POST") {
      const input = JSON.parse(String(init?.body));
      const created = {
        id: "65ab12cd34ef56ab78cd9001",
        ...input,
        sortOrder: prompts.length,
        createdAt: "2026-11-08T00:00:00.000Z",
        updatedAt: "2026-11-08T00:00:00.000Z",
      };
      prompts = [...prompts, created];
      return jsonResponse(created, 201);
    }
    if (method === "PATCH") {
      const input = JSON.parse(String(init?.body));
      const updated = { ...prompts[0], ...input };
      prompts = [updated];
      return jsonResponse(updated);
    }
    if (method === "DELETE") {
      prompts = [];
      return { ok: true, status: 204 };
    }
    throw new Error(`Unexpected request: ${method}`);
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    }),
  });
});

it("creates, edits, and deletes a prompt while keeping the list synchronized", async () => {
  const user = userEvent.setup();
  renderDialog();
  const dialog = await screen.findByRole("dialog", { name: "프롬프트 설정" });

  await user.click(
    await within(dialog).findByRole("button", { name: "첫 프롬프트 추가" }),
  );
  await user.type(within(dialog).getByLabelText("제목"), "균형 조합");
  await user.type(
    within(dialog).getByLabelText("내용"),
    "홀짝과 구간을 고려해 주세요.",
  );
  await user.click(within(dialog).getByRole("button", { name: "저장하기" }));

  await within(dialog).findByText("균형 조합");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/saved-prompts",
    expect.objectContaining({ method: "POST" }),
  );
  await user.click(
    within(dialog).getByRole("button", { name: "수정: 균형 조합" }),
  );
  const titleInput = within(dialog).getByLabelText("제목");
  await user.clear(titleInput);
  await user.type(titleInput, "수정된 조합");
  await user.click(within(dialog).getByRole("button", { name: "수정 저장" }));

  await within(dialog).findByText("수정된 조합");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/saved-prompts/65ab12cd34ef56ab78cd9001",
    expect.objectContaining({ method: "PATCH" }),
  );
  await user.click(
    within(dialog).getByRole("button", { name: "삭제: 수정된 조합" }),
  );
  await user.click(
    within(dialog).getByRole("button", { name: "삭제 확인: 수정된 조합" }),
  );

  await within(dialog).findByText("아직 저장한 프롬프트가 없어요.");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/saved-prompts/65ab12cd34ef56ab78cd9001",
    expect.objectContaining({ method: "DELETE" }),
  );
});

it("shows the five-prompt capacity and disables another prompt", async () => {
  prompts = Array.from({ length: 5 }, (_, index) => ({
    id: `65ab12cd34ef56ab78cd90${String(index).padStart(2, "0")}`,
    title: `프롬프트 ${index + 1}`,
    content: "내용",
    sortOrder: index,
    createdAt: "2026-11-08T00:00:00.000Z",
    updatedAt: "2026-11-08T00:00:00.000Z",
  }));
  renderDialog();
  const dialog = await screen.findByRole("dialog", { name: "프롬프트 설정" });

  expect(await within(dialog).findByText("5 / 5개 저장됨")).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", { name: "새 프롬프트 추가" }),
  ).toBeDisabled();
});

it("shows an inline validation error and does not send overlong content", async () => {
  const user = userEvent.setup();
  renderDialog();
  const dialog = await screen.findByRole("dialog", { name: "프롬프트 설정" });
  await user.click(
    await within(dialog).findByRole("button", { name: "첫 프롬프트 추가" }),
  );
  await user.type(within(dialog).getByLabelText("제목"), "제목");
  fireEvent.change(within(dialog).getByLabelText("내용"), {
    target: { value: "가".repeat(301) },
  });
  await user.click(within(dialog).getByRole("button", { name: "저장하기" }));

  expect(
    within(dialog).getByText("내용은 300자까지 입력할 수 있어요."),
  ).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalledWith(
    "/api/saved-prompts",
    expect.objectContaining({ method: "POST" }),
  );
});

it("shows a load error and lets the user retry", async () => {
  fetchMock
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementationOnce(async () => jsonResponse([]));
  const user = userEvent.setup();
  renderDialog();
  const dialog = await screen.findByRole("dialog", { name: "프롬프트 설정" });
  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "저장 프롬프트를 불러오지 못했어요.",
  );

  await user.click(
    within(dialog).getByRole("button", { name: "다시 불러오기" }),
  );

  expect(
    await within(dialog).findByText("아직 저장한 프롬프트가 없어요."),
  ).toBeInTheDocument();
});

it("shows a loading status until the prompt list arrives", async () => {
  let resolveRequest!: (response: ReturnType<typeof jsonResponse>) => void;
  fetchMock.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveRequest = resolve;
    }),
  );
  renderDialog();
  const dialog = await screen.findByRole("dialog", { name: "프롬프트 설정" });
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    "저장 프롬프트를 불러오는 중이에요.",
  );

  resolveRequest(jsonResponse([]));

  expect(
    await within(dialog).findByText("아직 저장한 프롬프트가 없어요."),
  ).toBeInTheDocument();
});

it("opens as a modal dialog and closes on Escape", async () => {
  const onClose = vi.fn();
  const queryClient = new QueryClient();
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  render(<SavedPromptManagerDialog open userId={userId} onClose={onClose} />, {
    wrapper: Wrapper,
  });

  const dialog = await screen.findByRole("dialog", { name: "프롬프트 설정" });
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

it("closes the native modal when the parent closes it", async () => {
  const queryClient = new QueryClient();
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  const view = render(
    <SavedPromptManagerDialog open userId={userId} onClose={vi.fn()} />,
    { wrapper: Wrapper },
  );
  await screen.findByRole("dialog", { name: "프롬프트 설정" });

  view.rerender(
    <QueryClientProvider client={queryClient}>
      <SavedPromptManagerDialog
        open={false}
        userId={userId}
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  );

  expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
});
