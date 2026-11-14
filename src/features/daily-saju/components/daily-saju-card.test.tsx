import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DailySajuCard } from "./daily-saju-card";

const { useDailySajuRecommendation } = vi.hoisted(() => ({
  useDailySajuRecommendation: vi.fn(),
}));
vi.mock("../hooks/use-daily-saju-recommendation", () => ({
  useDailySajuRecommendation,
}));

it("shows a content skeleton while today's recommendation loads", () => {
  useDailySajuRecommendation.mockReturnValue({ isPending: true });
  render(
    <DailySajuCard userId="user-1" dateKey="2026-11-14" hasBirthTime={false} />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "오늘의 숫자를 불러오는 중",
  );
});

it("shows the saved number, its explanation and an entertainment disclaimer", () => {
  useDailySajuRecommendation.mockReturnValue({
    data: {
      status: "ready",
      number: 23,
      explanation: "오늘의 일진을 참고한 숫자입니다.",
    },
  });
  render(
    <DailySajuCard userId="user-1" dateKey="2026-11-14" hasBirthTime={false} />,
  );
  expect(screen.getByText("23")).toBeInTheDocument();
  expect(
    screen.getByText("오늘의 일진을 참고한 숫자입니다."),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "태어난 시간을 입력하지 않아 시주는 추천에 반영되지 않았어요.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/당첨을 예측하거나 보장하지 않아요/),
  ).toBeInTheDocument();
});

it("offers a retry action when the recommendation request fails", () => {
  const refetch = vi.fn();
  useDailySajuRecommendation.mockReturnValue({ isError: true, refetch });
  render(
    <DailySajuCard userId="user-1" dateKey="2026-11-14" hasBirthTime={false} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(refetch).toHaveBeenCalledOnce();
});
