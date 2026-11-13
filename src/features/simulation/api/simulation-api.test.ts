import { afterEach, describe, expect, it, vi } from "vitest";
import { createSimulation, SimulationApiError } from "./simulation-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createSimulation", () => {
  it("preserves non-retryable server errors for the UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "시뮬레이션하려면 최소 60회차의 당첨 자료가 필요해요.",
            retryable: false,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(createSimulation(5)).rejects.toMatchObject({
      name: "SimulationApiError",
      retryable: false,
      message: "시뮬레이션하려면 최소 60회차의 당첨 자료가 필요해요.",
    });
  });

  it("marks server failures retryable unless the API says otherwise", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "잠시 후 다시 시도해 주세요." }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(createSimulation(5)).rejects.toMatchObject({
      retryable: true,
      message: "잠시 후 다시 시도해 주세요.",
    });
  });

  it("exposes the retry flag on its typed error", () => {
    expect(new SimulationApiError("고칠 수 있는 오류", false).retryable).toBe(
      false,
    );
  });
});
