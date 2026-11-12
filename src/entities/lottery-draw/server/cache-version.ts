import { createHash } from "node:crypto";
import type { LotteryDrawRecord } from "../model/document";

export function createLotteryDrawCacheVersion(
  draw: LotteryDrawRecord | null,
): string {
  if (!draw) return "empty";

  const normalizedDraw = {
    roundNumber: draw.roundNumber,
    drawDate: draw.drawDate.toISOString(),
    numbers: [...draw.numbers],
    bonusNumber: draw.bonusNumber,
    prizesByRank: [...draw.prizesByRank].sort(
      (left, right) => left.rank - right.rank,
    ),
  };

  return createHash("sha256")
    .update(JSON.stringify(normalizedDraw))
    .digest("hex");
}
