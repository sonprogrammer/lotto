import { ObjectId } from "mongodb";
import { syncLotteryDraws } from "@/entities/lottery-draw";
import { getMongoDb } from "@/shared/server/mongodb/client";
import type { SavedCombination } from "../model/combination";
import type { SavedCombinationsPage } from "../model/page";
import type { SavedCombinationDocument } from "../model/document";
import type { SavedCombinationCreate } from "../model/input";
import { serializeSavedCombination } from "./serialize-combination";

export class SavedCombinationNotFoundError extends Error {}

function getCollection() {
  return getMongoDb().then((db) =>
    db.collection<SavedCombinationDocument>("saved_combinations"),
  );
}

export async function listSavedCombinations(
  userId: string,
  page: number,
  pageSize: number,
): Promise<SavedCombinationsPage> {
  const collection = await getCollection();
  await collection.createIndex({ userId: 1, createdAt: -1 });
  const total = await collection.countDocuments({ userId });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const resolvedPage = Math.min(page, totalPages);
  const documents = await collection
    .find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .skip((resolvedPage - 1) * pageSize)
    .limit(pageSize)
    .toArray();
  return {
    items: documents.map(serializeSavedCombination),
    page: resolvedPage,
    pageSize,
    total,
    totalPages,
  };
}

export async function createSavedCombination(
  userId: string,
  input: SavedCombinationCreate,
) {
  const collection = await getCollection();
  const { latestRound: round } = await syncLotteryDraws();
  const now = new Date();
  const common = {
    _id: new ObjectId(),
    userId,
    numbers: [...input.numbers].sort(
      (a, b) => a - b,
    ) as SavedCombinationDocument["numbers"],
    trackingStartRound: round + 1,
    numberVersions: [],
    drawResults: [],
    createdAt: now,
    updatedAt: now,
  };
  const document: SavedCombinationDocument =
    input.source === "manual"
      ? { ...common, source: "manual" }
      : {
          ...common,
          source: "ai-assisted",
          analysisSummary: input.analysisSummary,
        };
  await collection.insertOne(document);
  return serializeSavedCombination(document);
}

export async function updateSavedCombination(
  userId: string,
  id: string,
  numbers: SavedCombination["numbers"],
) {
  const collection = await getCollection();
  const existing = await collection.findOne({ _id: new ObjectId(id), userId });
  if (!existing) throw new SavedCombinationNotFoundError();
  const { latestRound: round } = await syncLotteryDraws();
  const numberVersions = [...existing.numberVersions];
  if (round >= existing.trackingStartRound)
    numberVersions.push({
      numbers: existing.numbers,
      fromRound: existing.trackingStartRound,
      throughRound: round,
    });
  const result = await collection.findOneAndUpdate(
    { _id: existing._id, userId },
    {
      $set: {
        numbers: [...numbers].sort(
          (a, b) => a - b,
        ) as SavedCombinationDocument["numbers"],
        numberVersions,
        trackingStartRound: round + 1,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  if (!result) throw new SavedCombinationNotFoundError();
  return serializeSavedCombination(result);
}

export async function deleteSavedCombinations(userId: string, ids?: string[]) {
  const collection = await getCollection();
  if (!ids) return (await collection.deleteMany({ userId })).deletedCount;
  const objectIds = ids.map((id) => new ObjectId(id));
  return (await collection.deleteMany({ userId, _id: { $in: objectIds } }))
    .deletedCount;
}

export async function deleteSavedCombination(userId: string, id: string) {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id), userId });
  if (!result.deletedCount) throw new SavedCombinationNotFoundError();
}
