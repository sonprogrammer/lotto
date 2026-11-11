import { isValidElement } from "react";
import { expect, it, vi } from "vitest";

const { connectionMock } = vi.hoisted(() => ({
  connectionMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/server", () => ({ connection: connectionMock }));
vi.mock("@/features/auth/components/auth-aware-preview", () => ({
  AuthAwarePreview: () => null,
}));

import Home from "./page";

it("waits for a request and does not render a guest preview as fallback", async () => {
  const element = await Home();

  expect(isValidElement(element)).toBe(true);
  expect(element?.type).not.toBe("Suspense");
  expect(connectionMock).toHaveBeenCalledOnce();
});
