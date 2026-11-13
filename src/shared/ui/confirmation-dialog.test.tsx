import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { ConfirmationDialog } from "./confirmation-dialog";

beforeEach(() => {
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

it("opens an accessible modal and invokes its confirm and cancel actions", async () => {
  const user = userEvent.setup();
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmationDialog
      open
      title="조합을 삭제할까요?"
      description="삭제한 조합은 복구할 수 없어요."
      confirmLabel="삭제"
      isDestructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );

  const dialog = screen.getByRole("dialog", { name: "조합을 삭제할까요?" });
  expect(dialog).toHaveAttribute("aria-modal", "true");
  await user.click(screen.getByRole("button", { name: "취소" }));
  expect(onCancel).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "삭제" }));
  expect(onConfirm).toHaveBeenCalledOnce();
});

it("keeps a pending confirmation open when Escape is pressed", async () => {
  const onCancel = vi.fn();
  render(
    <ConfirmationDialog
      open
      title="조합을 삭제할까요?"
      description="삭제한 조합은 복구할 수 없어요."
      confirmLabel="삭제"
      isPending
      onConfirm={vi.fn()}
      onCancel={onCancel}
    />,
  );

  const dialog = screen.getByRole("dialog", { name: "조합을 삭제할까요?" });
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(onCancel).not.toHaveBeenCalled();
  expect(dialog).toBeInTheDocument();
});
