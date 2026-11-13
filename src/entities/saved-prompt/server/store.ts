import { ObjectId } from "mongodb";
import { getMongoDb } from "@/shared/server/mongodb/client";
import type { SavedPrompt } from "../model/prompt";
import type { SavedPromptDocument } from "../model/document";
import type { SavedPromptCreate, SavedPromptUpdate } from "../model/input";
import { serializeSavedPrompt } from "./serialize-prompt";

const MAX_SAVED_PROMPTS = 5;

export class SavedPromptLimitError extends Error {}
export class SavedPromptNotFoundError extends Error {}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function getCollection() {
  return getMongoDb().then((database) =>
    database.collection<SavedPromptDocument>("saved_prompts"),
  );
}

export async function listSavedPrompts(userId: string): Promise<SavedPrompt[]> {
  const collection = await getCollection();
  const documents = await collection
    .find({ userId })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  return documents.map(serializeSavedPrompt);
}

export async function createSavedPrompt(
  userId: string,
  input: SavedPromptCreate,
): Promise<SavedPrompt> {
  const collection = await getCollection();
  await collection.createIndex({ userId: 1, sortOrder: 1 }, { unique: true });

  for (let attempt = 0; attempt < MAX_SAVED_PROMPTS; attempt += 1) {
    let availableSlot: number | undefined;
    for (let sortOrder = 0; sortOrder < MAX_SAVED_PROMPTS; sortOrder += 1) {
      const existing = await collection.findOne(
        { userId, sortOrder },
        { projection: { _id: 1 } },
      );
      if (!existing) {
        availableSlot = sortOrder;
        break;
      }
    }
    if (availableSlot === undefined) throw new SavedPromptLimitError();

    const now = new Date();
    const document: SavedPromptDocument = {
      _id: new ObjectId(),
      userId,
      ...input,
      sortOrder: availableSlot,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await collection.insertOne(document);
      return serializeSavedPrompt(document);
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }

  throw new SavedPromptLimitError();
}

export async function updateSavedPrompt(
  userId: string,
  id: string,
  input: SavedPromptUpdate,
): Promise<SavedPrompt> {
  const collection = await getCollection();
  const document = await collection.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!document) throw new SavedPromptNotFoundError();
  return serializeSavedPrompt(document);
}

export async function deleteSavedPrompt(
  userId: string,
  id: string,
): Promise<void> {
  const collection = await getCollection();
  const document = await collection.findOneAndDelete({
    _id: new ObjectId(id),
    userId,
  });
  if (!document) throw new SavedPromptNotFoundError();
}
