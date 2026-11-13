import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SavedCombination } from "@/entities/saved-combination/model/combination";
import { SavedCombinationCard } from "./saved-combination-card";

const baseItem: SavedCombination = {
  id: "65ab12cd34ef56ab78cd90ef",
  source: "manual",
  numbers: [1, 8, 15, 22, 29, 36],
  trackingStartRound: 100,
  numberVersions: [],
  drawResults: [],
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

function renderCard(item: SavedCombination) {
  render(
    <SavedCombinationCard
      item={item}
      selected={false}
      busy={false}
      onSelect={vi.fn()}
      onSave={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
}

describe("SavedCombinationCard results", () => {
  it("shows the latest winning round and prize in the card summary", () => {
    renderCard({
      ...baseItem,
      drawResults: [
        {
          roundNumber: 1249,
          drawDate: "2026-11-07T00:00:00.000Z",
          numbersSnapshot: baseItem.numbers,
          matchedNumberCount: 3,
          bonusMatched: false,
          rank: 5,
          amountPerWinner: 5000,
        },
        {
          roundNumber: 1250,
          drawDate: "2026-11-14T00:00:00.000Z",
          numbersSnapshot: baseItem.numbers,
          matchedNumberCount: 4,
          bonusMatched: false,
          rank: 4,
          amountPerWinner: 50000,
        },
      ],
    });

    expect(screen.getByText("최근 결과").parentElement).toHaveTextContent(
      "1250회 · 4등 · 50,000원",
    );
    expect(screen.getByText(/당첨 확인 이력 2회/)).toBeInTheDocument();
  });

  it("shows the latest no-win result and keeps the next-draw empty message", () => {
    renderCard({
      ...baseItem,
      drawResults: [
        {
          roundNumber: 1250,
          drawDate: "2026-11-14T00:00:00.000Z",
          numbersSnapshot: baseItem.numbers,
          matchedNumberCount: 1,
          bonusMatched: false,
          rank: null,
          amountPerWinner: 0,
        },
      ],
    });

    expect(screen.getByText("최근 결과").parentElement).toHaveTextContent(
      "1250회 · 미당첨",
    );
  });

  it("keeps the next-draw message when no result exists", () => {
    renderCard(baseItem);

    expect(
      screen.getByText("다음 추첨 결과부터 확인해요."),
    ).toBeInTheDocument();
  });
});
