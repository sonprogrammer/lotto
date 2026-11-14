import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SajuProfileForm } from "./saju-profile-form";

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

it("shows the optional name and birth time fields for a new profile", () => {
  render(
    <SajuProfileForm profile={null} onSave={vi.fn()} onDelete={vi.fn()} />,
  );
  expect(screen.getByLabelText("이름 (선택)")).toBeInTheDocument();
  expect(screen.getByLabelText("태어난 날짜")).toBeInTheDocument();
  expect(screen.getByLabelText("태어난 시간 (선택)")).toBeInTheDocument();
  expect(screen.queryByLabelText("윤달")).not.toBeInTheDocument();
});

it("shows lunar leap-month only for lunar calendar and saves the entered profile", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<SajuProfileForm profile={null} onSave={onSave} onDelete={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("달력 기준"), {
    target: { value: "lunar" },
  });
  expect(screen.getByLabelText("윤달")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("이름 (선택)"), {
    target: { value: "아빠" },
  });
  fireEvent.change(screen.getByLabelText("태어난 날짜"), {
    target: { value: "1980-04-12" },
  });
  expect(screen.getByLabelText("태어난 날짜")).toHaveValue("1980-04-12");
  expect(screen.getByLabelText("태어난 시간 (선택)")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("태어난 시간 (선택)"), {
    target: { value: "08:30" },
  });
  fireEvent.click(screen.getByLabelText("윤달"));
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      displayName: "아빠",
      birthDate: "1980-04-12",
      calendarType: "lunar",
      isLeapMonth: true,
      birthTime: "08:30",
    }),
  );
});

it("rejects an impossible date before saving and keeps the entered value", async () => {
  const onSave = vi.fn();
  render(<SajuProfileForm profile={null} onSave={onSave} onDelete={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("태어난 날짜"), {
    target: { value: "2023-02-29" },
  });
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "생년월일을 연도, 월, 일 순서로 숫자 8자리 입력해 주세요.",
  );
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByLabelText("태어난 날짜")).toHaveValue("2023-02-29");
});

it("requires confirmation before deleting an existing profile", async () => {
  const onDelete = vi.fn().mockResolvedValue(undefined);
  const profile = {
    displayName: "아빠",
    birthDate: "1980-04-12",
    calendarType: "solar" as const,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
  render(
    <SajuProfileForm profile={profile} onSave={vi.fn()} onDelete={onDelete} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "사주 정보 삭제" }));
  expect(onDelete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "삭제하기" }));
  await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
});
