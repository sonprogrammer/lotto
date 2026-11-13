import type { SavedCombinationDocument } from "../model/document";
import { SavedCombinationSchema } from "../model/combination";

export function serializeSavedCombination(document: SavedCombinationDocument) {
  return SavedCombinationSchema.parse({
    id: document._id.toHexString(),
    source: document.source,
    numbers: document.numbers,
    analysisSummary: document.analysisSummary,
    trackingStartRound: document.trackingStartRound,
    numberVersions: document.numberVersions,
    drawResults: document.drawResults.map((result) => ({
      ...result,
      drawDate: result.drawDate.toISOString(),
    })),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  });
}
