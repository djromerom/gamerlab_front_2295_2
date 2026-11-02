import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEvaluationProgress, progressPercentage } from "./evaluationProgress";

describe("fetchEvaluationProgress", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lee {completed, assigned} de GET /evaluation/progress", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ completed: 12, assigned: 20 }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchEvaluationProgress()).resolves.toEqual({ completed: 12, assigned: 20 });
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.test/evaluation/progress");
  });

  it("nunca deja que completed supere assigned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ completed: 9, assigned: 4 }), { status: 200 })),
    );
    await expect(fetchEvaluationProgress()).resolves.toEqual({ completed: 4, assigned: 4 });
  });

  it("falla si el servidor responde error o forma inválida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    await expect(fetchEvaluationProgress()).rejects.toThrow();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ x: 1 }), { status: 200 })));
    await expect(fetchEvaluationProgress()).rejects.toThrow();
  });
});

describe("progressPercentage", () => {
  it("calcula el porcentaje y acota a 0..100", () => {
    expect(progressPercentage({ completed: 5, assigned: 20 })).toBe(25);
    expect(progressPercentage({ completed: 0, assigned: 0 })).toBe(0);
    expect(progressPercentage({ completed: 30, assigned: 20 })).toBe(100);
  });
});
