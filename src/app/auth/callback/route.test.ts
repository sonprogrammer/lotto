import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: { exchangeCodeForSession },
  }),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
  });

  it("exchanges the PKCE code and redirects to the requested local path", async () => {
    const response = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=pkce-code&next=%2Fanalysis%3Ftab%3Dweekly",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/analysis?tab=weekly",
    );
  });

  it("falls back to home instead of redirecting to an external destination", async () => {
    const response = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=pkce-code&next=%2F%2Fevil.example",
      ),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects to the auth error page when the callback has no code", async () => {
    const response = await GET(
      new Request("http://localhost:3000/auth/callback"),
    );

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/error",
    );
  });

  it("redirects to the auth error page when code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: new Error("invalid code"),
    });

    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=invalid-code"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/error",
    );
  });
});
