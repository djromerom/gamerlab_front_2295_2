import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import { fetchPublicPodium, fetchPublicRankingVisible } from "@/features/results/api/publicPodium";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => apiFetch.mockReset());

describe("api del podio público (ARK-306/307)", () => {
  it("pide by-n/all y lee las filas sin nota", async () => {
    apiFetch.mockResolvedValue(
      json([
        { teamId: 15, teamCode: "N1-ISI-101", teamName: "Pixel", isExternal: false, videogameId: 24, videogameName: "Stella", logoUrl: "l.png", videogameLogoUrl: null, editionId: 5, level: 1, levelPosition: 1, position: 1 },
        { teamId: 16, teamCode: "N2-ISI-102", teamName: "Byte", videogameName: "Nova", position: 2 },
        { teamCode: "sin-id" },
      ]),
    );
    const rows = await fetchPublicPodium();
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/teams/final-score/by-n/all");
    expect(rows).toEqual([
      { teamId: 15, teamCode: "N1-ISI-101", teamName: "Pixel", videogameName: "Stella", logoUrl: "l.png", videogameLogoUrl: null, level: 1, levelPosition: 1 },
      { teamId: 16, teamCode: "N2-ISI-102", teamName: "Byte", videogameName: "Nova", logoUrl: null, videogameLogoUrl: null, level: 2, levelPosition: 2 },
    ]);
  });

  it("si falla, lanza un error con el código", async () => {
    apiFetch.mockResolvedValue(json({}, 500));
    await expect(fetchPublicPodium()).rejects.toThrow("No se pudo cargar el ranking (error 500).");
  });

  it("lee si el ranking está publicado", async () => {
    apiFetch.mockResolvedValueOnce(json({ showRanking: true }));
    await expect(fetchPublicRankingVisible()).resolves.toBe(true);
    apiFetch.mockResolvedValueOnce(json({ showRanking: false }));
    await expect(fetchPublicRankingVisible()).resolves.toBe(false);
  });
});
