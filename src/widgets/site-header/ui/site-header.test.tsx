import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

const { managerMock } = vi.hoisted(() => ({ managerMock: vi.fn() }));
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
    <SiteHeader
      displayName="손영진"
      userId="65ab12cd34ef56ab78cd90ef"
      isConfigured
      isSignedIn
    />,
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
  render(<SiteHeader isConfigured={false} isSignedIn={false} />);

  expect(
    screen.queryByRole("button", { name: "프롬프트 설정" }),
  ).not.toBeInTheDocument();
});
