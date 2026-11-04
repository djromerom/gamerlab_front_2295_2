import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { fetchEditions } from "@/fetchs/editions";
import { fetchOwnTeamForEdition, resolveOwnTeamForEdition } from "./ownTeam";
import type { Team } from "@/types/Team";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("@/fetchs/editions", () => ({ fetchEditions: vi.fn() }));

const team = (id: number, editionId: number, isMine: boolean): Team => ({
  id,
  videogameId: id,
  gameName: `Juego ${id}`,
  teamName: `Equipo ${id}`,
  teamCode: `T-${id}`,
  editionId,
  isMine,
  status: "CONFIRMADO",
});

describe("resolveOwnTeamForEdition", () => {
  it("selecciona solo el equipo propio de la edición activa", () => {
    const teams = [
      team(11, 2025, true),
      team(22, 2026, true),
    ];

    expect(resolveOwnTeamForEdition(teams, 2026)?.id).toBe(22);
  });

  describe("fetchOwnTeamForEdition", () => {
    beforeEach(() => {
      vi.resetModules();
      vi.clearAllMocks();
    });

    it("rechaza cuando no existe una edición activa", async () => {
      vi.mocked(fetchEditions).mockResolvedValue([
        { id: 1, status: "INACTIVE" } as never,
      ]);

      await expect(fetchOwnTeamForEdition()).rejects.toThrow("No hay una edición activa.");
    });

    it("rechaza cuando el usuario no tiene equipo propio", async () => {
      vi.mocked(fetchEditions).mockResolvedValue([
        { id: 1, status: "ACTIVE" } as never,
      ]);
      vi.mocked(apiFetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([team(11, 1, false)]),
      } as unknown as Response);

      await expect(fetchOwnTeamForEdition()).rejects.toThrow(
        "No se encontró un equipo propio en la edición seleccionada.",
      );
    });
  });

  it("permite resolver el equipo propio de una edición anterior como historial", () => {
    const teams = [
      team(11, 2025, true),
      team(22, 2026, true),
    ];

    expect(resolveOwnTeamForEdition(teams, 2025)?.id).toBe(11);
  });
});
