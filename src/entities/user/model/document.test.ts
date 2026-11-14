import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { KakaoUserDocumentSchema } from "./document";

describe("KakaoUserDocumentSchema", () => {
  const validDocument = {
    _id: new ObjectId(),
    kakaoId: "kakao-123",
    nickname: "손영진",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  it("accepts a valid user document", () => {
    expect(KakaoUserDocumentSchema.safeParse(validDocument).success).toBe(true);
  });

  it("accepts a legacy document without a stored nickname", () => {
    const legacyDocument = {
      _id: validDocument._id,
      kakaoId: validDocument.kakaoId,
      createdAt: validDocument.createdAt,
    };

    expect(KakaoUserDocumentSchema.safeParse(legacyDocument).success).toBe(
      true,
    );
  });

  it("accepts a user document with a separate saju profile", () => {
    expect(
      KakaoUserDocumentSchema.safeParse({
        ...validDocument,
        sajuProfile: {
          displayName: "아빠",
          birthDate: "1980-05-12",
          calendarType: "solar",
          createdAt: new Date("2026-11-14T00:00:00.000Z"),
          updatedAt: new Date("2026-11-14T00:00:00.000Z"),
        },
      }).success,
    ).toBe(true);
  });

  it.each([
    { kakaoId: "" },
    { nickname: "   " },
    { _id: "65ab12cd34ef56ab78cd90ef" },
    { createdAt: "2026-01-01T00:00:00.000Z" },
  ])("rejects an invalid user document field", (override) => {
    expect(
      KakaoUserDocumentSchema.safeParse({ ...validDocument, ...override })
        .success,
    ).toBe(false);
  });
});
