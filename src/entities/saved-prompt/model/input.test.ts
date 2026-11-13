import { describe, expect, it } from "vitest";
import {
  SavedPromptCreateSchema,
  SavedPromptIdSchema,
  SavedPromptUpdateSchema,
} from "./input";

describe("SavedPromptCreateSchema", () => {
  it("trims and accepts a title of 30 characters and content of 300 characters", () => {
    const result = SavedPromptCreateSchema.parse({
      title: `  ${"가".repeat(30)}  `,
      content: `  ${"나".repeat(300)}  `,
    });

    expect(result.title).toBe("가".repeat(30));
    expect(result.content).toBe("나".repeat(300));
  });

  it("rejects missing, blank, and over-limit values", () => {
    expect(SavedPromptCreateSchema.safeParse({}).success).toBe(false);
    expect(
      SavedPromptCreateSchema.safeParse({ title: " ", content: "x" }).success,
    ).toBe(false);
    expect(
      SavedPromptCreateSchema.safeParse({
        title: "x".repeat(31),
        content: "y",
      }).success,
    ).toBe(false);
    expect(
      SavedPromptCreateSchema.safeParse({
        title: "x",
        content: "y".repeat(301),
      }).success,
    ).toBe(false);
  });
});

describe("SavedPromptUpdateSchema", () => {
  it("accepts a partial update but rejects an empty update", () => {
    expect(
      SavedPromptUpdateSchema.safeParse({ title: "새 제목" }).success,
    ).toBe(true);
    expect(SavedPromptUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("SavedPromptIdSchema", () => {
  it("accepts a MongoDB ObjectId string and rejects an invalid id", () => {
    expect(
      SavedPromptIdSchema.safeParse("65ab12cd34ef56ab78cd90ef").success,
    ).toBe(true);
    expect(SavedPromptIdSchema.safeParse("not-an-object-id").success).toBe(
      false,
    );
  });
});
