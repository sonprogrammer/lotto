import { getMongoDb } from "@/shared/server/mongodb/client";
import type { LotteryDrawDocument } from "@/entities/lottery-draw/model/document";
import type { SavedCombinationDocument } from "../model/document";
import {
  calculateSavedCombinationDrawResult,
  resolveSavedCombinationNumbersForRound,
} from "../lib/calculate-draw-result";

export async function reconcileSavedCombinationDrawResults({
  historyChanged,
}: {
  historyChanged: boolean;
}): Promise<{ updatedCount: number }> {
  const database = await getMongoDb();
  const drawsCollection =
    database.collection<LotteryDrawDocument>("lottery_draws");
  const combinationsCollection =
    database.collection<SavedCombinationDocument>("saved_combinations");
  const [draws, combinations] = await Promise.all([
    drawsCollection.find({}).sort({ roundNumber: 1 }).toArray(),
    combinationsCollection.find({}).toArray(),
  ]);

  let updatedCount = 0;
  for (const combination of combinations) {
    const previousResults = new Map(
      combination.drawResults.map((result) => [result.roundNumber, result]),
    );
    const nextResults = [];

    for (const draw of draws) {
      const applicableNumbers = resolveSavedCombinationNumbersForRound({
        numbers: combination.numbers,
        trackingStartRound: combination.trackingStartRound,
        numberVersions: combination.numberVersions,
        roundNumber: draw.roundNumber,
      });
      if (!applicableNumbers) continue;

      const existingResult = previousResults.get(draw.roundNumber);
      if (existingResult && !historyChanged) {
        nextResults.push(existingResult);
      } else {
        nextResults.push(
          calculateSavedCombinationDrawResult({
            numbers: applicableNumbers,
            draw,
          }),
        );
      }
    }

    if (areDrawResultsEqual(combination.drawResults, nextResults)) continue;

    const result = await combinationsCollection.updateOne(
      {
        _id: combination._id,
        userId: combination.userId,
        numbers: combination.numbers,
        trackingStartRound: combination.trackingStartRound,
        numberVersions: combination.numberVersions,
        drawResults: combination.drawResults,
        updatedAt: combination.updatedAt,
      },
      { $set: { drawResults: nextResults, updatedAt: new Date() } },
    );
    if (result.matchedCount > 0) updatedCount += 1;
  }

  return { updatedCount };
}

function areDrawResultsEqual(
  current: SavedCombinationDocument["drawResults"],
  next: SavedCombinationDocument["drawResults"],
) {
  return JSON.stringify(current) === JSON.stringify(next);
}
