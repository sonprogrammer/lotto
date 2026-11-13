import { ObjectId } from "mongodb";
import { getMongoDb } from "@/shared/server/mongodb/client";
import { SimulationRunSummaryDocumentSchema } from "../model/simulation-run";
import type {
  SimulationRunDocument,
  SimulationRun,
  SimulationRunSummary,
} from "../model/simulation-run";
import {
  serializeSimulationRun,
  serializeSimulationRunSummary,
} from "./serialize-simulation-run";

type SimulationRunDraft = Omit<
  SimulationRunDocument,
  "_id" | "userId" | "createdAt"
>;

function getCollection() {
  return getMongoDb().then((database) =>
    database.collection<SimulationRunDocument>("simulation_runs"),
  );
}

export async function createSimulationRun(
  userId: string,
  draft: SimulationRunDraft,
): Promise<SimulationRun> {
  const collection = await getCollection();
  await collection.createIndex({ userId: 1, createdAt: -1 });

  const document: SimulationRunDocument = {
    _id: new ObjectId(),
    userId,
    createdAt: new Date(),
    ...draft,
  };
  await collection.insertOne(document);
  return serializeSimulationRun(document);
}

export async function listSimulationRuns(
  userId: string,
  limit = 20,
): Promise<SimulationRunSummary[]> {
  const collection = await getCollection();
  await collection.createIndex({ userId: 1, createdAt: -1 });
  const documents = await collection
    .find({ userId }, { projection: { rounds: 0 } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(Math.min(Math.max(1, Math.floor(limit)), 50))
    .toArray();
  return documents.map((document) =>
    serializeSimulationRunSummary(
      SimulationRunSummaryDocumentSchema.parse(document),
    ),
  );
}

export async function getSimulationRun(
  userId: string,
  id: string,
): Promise<SimulationRun | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const document = await (
    await getCollection()
  ).findOne({
    _id: new ObjectId(id),
    userId,
  });
  return document ? serializeSimulationRun(document) : null;
}
