import { beforeEach, describe, expect, it, vi } from "vitest";

const { getKakaoConfigMock, getMongoConfigMock, getCurrentUserMock } =
  vi.hoisted(() => ({
    getKakaoConfigMock: vi.fn(),
    getMongoConfigMock: vi.fn(),
    getCurrentUserMock: vi.fn(),
  }));

vi.mock("@/features/auth/server/config", () => ({
  getKakaoConfig: getKakaoConfigMock,
  getMongoConfig: getMongoConfigMock,
}));
vi.mock("@/features/auth/server/current-session", () => ({
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/features/preview/components/lotto-number-preview", () => ({
  LottoNumberPreview: () => null,
}));

import { AuthAwarePreview } from "./auth-aware-preview";

describe("AuthAwarePreview", () => {
  beforeEach(() => {
    getKakaoConfigMock.mockReset().mockReturnValue({});
    getMongoConfigMock.mockReset().mockReturnValue({});
    getCurrentUserMock.mockReset().mockResolvedValue(null);
  });

  it("keeps the random preview available when authentication config is missing", async () => {
    getMongoConfigMock.mockImplementation(() => {
      throw new Error("missing MongoDB config");
    });
    const element = await AuthAwarePreview();

    expect(element.props).toMatchObject({
      isConfigured: false,
      isSignedIn: false,
    });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it("does not show a signed-in state when there is no active session", async () => {
    const element = await AuthAwarePreview();

    expect(element.props).toMatchObject({
      isConfigured: true,
      isSignedIn: false,
    });
  });

  it("passes the signed-in user's nickname to the preview header", async () => {
    getCurrentUserMock.mockResolvedValue({
      userId: "user-1",
      nickname: "손영진",
    });

    const element = await AuthAwarePreview();

    expect(element.props).toMatchObject({
      isSignedIn: true,
      displayName: "손영진",
    });
  });
});
