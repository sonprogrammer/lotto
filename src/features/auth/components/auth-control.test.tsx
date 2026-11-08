import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthControl } from "./auth-control";

const {
  createBrowserClientMock,
  signInWithOAuthMock,
  signOutMock,
  refreshMock,
} = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
  signInWithOAuthMock: vi.fn(),
  signOutMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: createBrowserClientMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("AuthControl", () => {
  beforeEach(() => {
    createBrowserClientMock.mockReset().mockReturnValue({
      auth: {
        signInWithOAuth: signInWithOAuthMock,
        signOut: signOutMock,
      },
    });
    signInWithOAuthMock.mockReset().mockResolvedValue({ error: null });
    signOutMock.mockReset().mockResolvedValue({ error: null });
    refreshMock.mockReset();
  });

  it("starts Kakao OAuth with the app callback when configured", async () => {
    render(<AuthControl isConfigured isSignedIn={false} />);

    fireEvent.click(screen.getByRole("button", { name: "카카오로 로그인" }));

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: "kakao",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });
    });
  });

  it("explains that setup is required when Supabase is not configured", async () => {
    render(<AuthControl isConfigured={false} isSignedIn={false} />);

    fireEvent.click(screen.getByRole("button", { name: "카카오로 로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "로그인 설정을 준비 중이에요.",
    );
    expect(createBrowserClientMock).not.toHaveBeenCalled();
  });

  it("signs out and refreshes the visible session state", async () => {
    render(<AuthControl isConfigured isSignedIn />);

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledOnce();
      expect(refreshMock).toHaveBeenCalledOnce();
    });
  });

  it("shows a recoverable message when sign-out fails", async () => {
    signOutMock.mockResolvedValue({ error: new Error("network error") });
    render(<AuthControl isConfigured isSignedIn />);

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "로그아웃을 완료하지 못했어요.",
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
