import { describe, expect, it } from "vitest";
import type { PublicPodiumTeam } from "@/features/results/api/publicPodium";
import { groupPodiumByLevel, levelLabel, podiumLogo, podiumTeamName } from "@/features/results/lib/publicPodium";

const row = (teamId: number, level: number, levelPosition: number, extra: Partial<PublicPodiumTeam> = {}): PublicPodiumTeam => ({
  teamId,
  teamCode: `N${level}-ABC-${teamId}`,
  teamName: `Equipo ${teamId}`,
  videogameName: `Juego ${teamId}`,
  logoUrl: null,
  videogameLogoUrl: null,
  level,
  levelPosition,
  ...extra,
});

describe("podio público (HU-48)", () => {
  it("solo salen los niveles que llegan, semestres primero y Colegios al final", () => {
    const levels = groupPodiumByLevel([row(1, 0, 1), row(2, 10, 1), row(3, 2, 1), row(4, 1, 1)]);
    expect(levels.map((l) => l.label)).toEqual(["Primer Semestre", "Segundo Semestre", "Décimo Semestre", "Colegios"]);
  });

  it("ubica cada equipo por levelPosition, no por el orden en que llega", () => {
    const [level] = groupPodiumByLevel([row(3, 1, 3), row(1, 1, 1), row(2, 1, 2)]);
    expect(level.places.map((t) => t?.teamId)).toEqual([1, 2, 3]);
  });

  it("A1: con menos de 3 equipos deja los huecos vacíos", () => {
    const [level] = groupPodiumByLevel([row(1, 4, 1), row(2, 4, 2)]);
    expect(level.places.map((t) => t?.teamId)).toEqual([1, 2, undefined]);
  });

  it("ignora puestos fuera del podio", () => {
    const [level] = groupPodiumByLevel([row(1, 1, 1), row(9, 1, 4)]);
    expect(level.places.map((t) => t?.teamId)).toEqual([1, undefined, undefined]);
  });

  it("nombre y logo con respaldo", () => {
    expect(podiumTeamName(row(1, 1, 1, { teamName: null }))).toBe("N1-ABC-1");
    expect(podiumLogo(row(1, 1, 1, { videogameLogoUrl: "v.png" }))).toBe("v.png");
    expect(podiumLogo(row(1, 1, 1, { logoUrl: "t.png", videogameLogoUrl: "v.png" }))).toBe("t.png");
    expect(levelLabel(7)).toBe("Nivel 7");
  });
});
