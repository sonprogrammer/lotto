import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthControl } from "./auth-control";

const { fetchMock, refreshMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.stubGlobal("fetch", fetchMock);

describe("AuthControl", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    refreshMock.mockReset();
  });

  it("offers Kakao OAuth as a button instead of a link", () => {
    render(<AuthControl isConfigured isSignedIn={false} />);

    expect(
      screen.getByRole("button", { name: "카카오로 로그인" }),
    ).toHaveAttribute("type", "button");
    expect(
      screen.queryByRole("link", { name: "카카오로 로그인" }),
    ).not.toBeInTheDocument();
  });

  it("explains that setup is required when auth is not configured", async () => {
    render(<AuthControl isConfigured={false} isSignedIn={false} />);

    fireEvent.click(screen.getByRole("button", { name: "카카오로 로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "로그인 설정을 준비 중이에요.",
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the signed-in user's display name", () => {
    render(<AuthControl displayName="손영진" isConfigured isSignedIn />);

    expect(screen.getByText("손영진")).toBeInTheDocument();
    expect(screen.queryByText("카카오 로그인됨")).not.toBeInTheDocument();
  });

  it("offers a Kakao profile refresh instead of showing a generic account name", () => {
    render(<AuthControl isConfigured isSignedIn />);

    expect(screen.getByText("이름 확인 필요")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "카카오 프로필 갱신" }),
    ).toBeEnabled();
    expect(screen.queryByText("내 계정")).not.toBeInTheDocument();
  });

  it("signs out and refreshes the visible session state", async () => {
    render(<AuthControl isConfigured isSignedIn />);

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
      expect(refreshMock).toHaveBeenCalledOnce();
    });
  });

  it("shows a recoverable message when sign-out fails", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    render(<AuthControl isConfigured isSignedIn />);

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "로그아웃을 완료하지 못했어요.",
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
