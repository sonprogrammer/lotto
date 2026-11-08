import { MongoClient, type Db } from "mongodb";
import { getMongoConfig } from "./config";

let connection: Promise<MongoClient> | undefined;

export async function getMongoDb(): Promise<Db> {
  const { uri, dbName } = getMongoConfig();
  if (!connection) {
    const client = new MongoClient(uri);
    connection = client
      .connect()
      .then(() => client)
      .catch((error: unknown) => {
        connection = undefined;
        throw error;
      });
  }
  return (await connection).db(dbName);
}
