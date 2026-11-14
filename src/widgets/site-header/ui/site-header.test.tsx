import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";
import { QueryProvider } from "@/shared/providers/query-provider";

const { managerMock, pathnameMock } = vi.hoisted(() => ({
  managerMock: vi.fn(),
  pathnameMock: vi.fn(() => "/"),
}));
vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
vi.mock(
  "@/features/saved-prompt/components/saved-prompt-manager-dialog",
  () => ({
    SavedPromptManagerDialog: (props: unknown) => {
      managerMock(props);
      return <div role="dialog" aria-label="프롬프트 설정" />;
    },
  }),
);

vi.mock("@/features/auth/components/auth-control", () => ({
  AuthControl: () => null,
}));

it("opens private prompt settings from the signed-in navigation", () => {
  render(
    <QueryProvider>
      <SiteHeader
        displayName="손영진"
        userId="65ab12cd34ef56ab78cd90ef"
        isConfigured
        isSignedIn
      />
    </QueryProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "프롬프트 설정" }));

  expect(screen.getByRole("dialog", { name: "프롬프트 설정" })).toBeVisible();
  expect(managerMock).toHaveBeenCalledWith(
    expect.objectContaining({
      open: true,
      userId: "65ab12cd34ef56ab78cd90ef",
    }),
  );
});

it("does not show prompt settings to signed-out visitors", () => {
  render(
    <QueryProvider>
      <SiteHeader isConfigured={false} isSignedIn={false} />
    </QueryProvider>,
  );

  expect(
    screen.queryByRole("button", { name: "프롬프트 설정" }),
  ).not.toBeInTheDocument();
});

it("marks the current navigation link as active", () => {
  pathnameMock.mockReturnValue("/analysis");

  render(
    <QueryProvider>
      <SiteHeader isConfigured isSignedIn />
    </QueryProvider>,
  );

  expect(screen.getByRole("link", { name: "이번 주 분석" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "당첨 내역" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
});
