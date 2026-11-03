import { describe, expect, it } from "vitest";
import { resolveOwnTeamForEdition } from "./ownTeam";
import type { Team } from "@/types/Team";

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

  it("permite resolver el equipo propio de una edición anterior como historial", () => {
    const teams = [
      team(11, 2025, true),
      team(22, 2026, true),
    ];

    expect(resolveOwnTeamForEdition(teams, 2025)?.id).toBe(11);
  });
});
