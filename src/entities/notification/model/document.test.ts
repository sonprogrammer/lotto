import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import {
  NotificationDocumentSchema,
  PushDeliveryDocumentSchema,
  PushSubscriptionDocumentSchema,
} from "./document";

const common = {
  _id: new ObjectId(),
  userId: "a".repeat(24),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("notification persistence schemas", () => {
  it("accepts ranked and corrected inbox records", () => {
    const base = {
      ...common,
      savedCombinationId: new ObjectId(),
      roundNumber: 1250,
      drawDate: new Date(),
      readAt: null,
    };
    expect(
      NotificationDocumentSchema.safeParse({
        ...base,
        status: "won",
        rank: 3,
        amountPerWinner: 1000,
      }).success,
    ).toBe(true);
    expect(
      NotificationDocumentSchema.safeParse({
        ...base,
        status: "corrected",
        rank: null,
        amountPerWinner: 0,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid rank and push subscription keys", () => {
    expect(
      NotificationDocumentSchema.safeParse({
        ...common,
        savedCombinationId: new ObjectId(),
        roundNumber: 1250,
        drawDate: new Date(),
        status: "won",
        rank: 6,
        amountPerWinner: 0,
        readAt: null,
      }).success,
    ).toBe(false);
    expect(
      PushSubscriptionDocumentSchema.safeParse({
        ...common,
        endpoint: "not-a-url",
        keys: { p256dh: "", auth: "" },
        userAgent: null,
        lastUsedAt: new Date(),
      }).success,
    ).toBe(false);
  });

  it("accepts only defined delivery states", () => {
    const valid = {
      ...common,
      notificationId: new ObjectId(),
      subscriptionId: new ObjectId(),
      status: "pending",
      attemptedAt: null,
      sentAt: null,
      failureCode: null,
    };
    expect(PushDeliveryDocumentSchema.safeParse(valid).success).toBe(true);
    expect(
      PushDeliveryDocumentSchema.safeParse({ ...valid, status: "retry" })
        .success,
    ).toBe(false);
  });
});
