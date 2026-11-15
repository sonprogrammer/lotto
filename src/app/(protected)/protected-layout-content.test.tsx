import { isValidElement } from "react";
import { beforeEach, expect, it, vi } from "vitest";

const { connectionMock, currentUserMock, redirectMock } = vi.hoisted(() => ({
  connectionMock: vi.fn().mockResolvedValue(undefined),
  currentUserMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/server", () => ({ connection: connectionMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: currentUserMock,
}));
vi.mock("@/widgets/protected-app-shell", () => ({
  ProtectedAppShell: (props: Record<string, unknown>) => props,
}));

import { ProtectedLayoutContent } from "./protected-layout-content";

beforeEach(() => {
  vi.clearAllMocks();
  currentUserMock.mockResolvedValue({ userId: "user-1", nickname: "영진" });
  redirectMock.mockImplementation((path: string) => {
    throw new Error(`redirect:${path}`);
  });
});

it("checks the session once in the shared protected layout", async () => {
  const child = <div>private page</div>;
  const result = await ProtectedLayoutContent({ children: child });

  expect(connectionMock).toHaveBeenCalledOnce();
  expect(currentUserMock).toHaveBeenCalledOnce();
  expect(isValidElement(result)).toBe(true);
  expect(result?.props).toMatchObject({
    user: { userId: "user-1", nickname: "영진" },
    children: child,
  });
});

it("redirects an expired or missing session to the home page", async () => {
  currentUserMock.mockResolvedValue(null);

  await expect(
    ProtectedLayoutContent({ children: <div>private page</div> }),
  ).rejects.toThrow("redirect:/");
});
