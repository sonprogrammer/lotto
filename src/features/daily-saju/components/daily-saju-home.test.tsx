import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const { useSajuProfile, useSaveSajuProfile, useDeleteSajuProfile } = vi.hoisted(
  () => ({
    useSajuProfile: vi.fn(),
    useSaveSajuProfile: vi.fn(),
    useDeleteSajuProfile: vi.fn(),
  }),
);
vi.mock("../hooks/use-saju-profile", () => ({ useSajuProfile }));
vi.mock("../hooks/use-save-saju-profile", () => ({ useSaveSajuProfile }));
vi.mock("../hooks/use-delete-saju-profile", () => ({ useDeleteSajuProfile }));
vi.mock("@/widgets/site-header/ui/site-header", () => ({
  SiteHeader: () => null,
}));
vi.mock("./daily-saju-card", () => ({
  DailySajuCard: () => <div>오늘의 추천 카드</div>,
}));

import { DailySajuHome } from "./daily-saju-home";

beforeEach(() => {
  vi.clearAllMocks();
  useSaveSajuProfile.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  });
  useDeleteSajuProfile.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  });
});

it("keeps a clear loading state while the private profile is checked", () => {
  useSajuProfile.mockReturnValue({ isPending: true });
  render(<DailySajuHome userId="user-1" dateKey="2026-11-14" isConfigured />);
  expect(
    screen.getByRole("status", { name: "사주 정보를 불러오는 중" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("오늘의 추천 카드")).not.toBeInTheDocument();
});

it("shows only profile setup until the user has registered saju details", () => {
  useSajuProfile.mockReturnValue({
    isPending: false,
    data: { profile: null, dateKey: "2026-11-14" },
  });
  render(<DailySajuHome userId="user-1" dateKey="2026-11-14" isConfigured />);
  expect(
    screen.getByRole("heading", { name: "사주 정보를 입력해 주세요" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("오늘의 추천 카드")).not.toBeInTheDocument();
});

it("shows the profile and daily recommendation after registration", () => {
  useSajuProfile.mockReturnValue({
    isPending: false,
    data: {
      profile: {
        displayName: "아빠",
        birthDate: "1980-04-12",
        calendarType: "solar",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
      dateKey: "2026-11-14",
    },
  });
  render(<DailySajuHome userId="user-1" dateKey="2026-11-14" isConfigured />);
  expect(screen.getByText("아빠")).toBeInTheDocument();
  expect(screen.getByText("오늘의 추천 카드")).toBeInTheDocument();
});
