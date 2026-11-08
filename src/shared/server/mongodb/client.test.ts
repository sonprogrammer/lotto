// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";

const driver = vi.hoisted(() => ({
  connect: vi.fn(),
  db: vi.fn(() => ({ databaseName: "lotto" })),
  constructed: vi.fn(),
}));
vi.mock("mongodb", () => ({
  MongoClient: class {
    constructor(uri: string) {
      driver.constructed(uri);
    }
    connect = driver.connect;
    db = driver.db;
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

it("reuses the connection for simultaneous and subsequent requests", async () => {
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017");
  vi.stubEnv("MONGODB_DB_NAME", "lotto");
  driver.connect.mockResolvedValue(undefined);
  const { getMongoDb } = await import("./client");
  const databases = await Promise.all([getMongoDb(), getMongoDb()]);
  expect(databases[0]).toEqual({ databaseName: "lotto" });
  await getMongoDb();
  expect(driver.constructed).toHaveBeenCalledTimes(1);
  expect(driver.connect).toHaveBeenCalledTimes(1);
  expect(driver.db).toHaveBeenCalledWith("lotto");
});

it("retries a failed connection on the next request", async () => {
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017");
  vi.stubEnv("MONGODB_DB_NAME", "lotto");
  driver.connect
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(undefined);
  const { getMongoDb } = await import("./client");
  await expect(getMongoDb()).rejects.toThrow("offline");
  expect(await getMongoDb()).toEqual({ databaseName: "lotto" });
  expect(driver.connect).toHaveBeenCalledTimes(2);
});
