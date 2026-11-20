import { describe, expect, it } from "vitest";
import type { StudentHighlightedGame } from "@/features/public/api/highlightedGames";
import { editionLabel, editionsOf, playerUrl, webPlay } from "@/features/public/lib/highlightedGames";

const juego = (parcial: Partial<StudentHighlightedGame> & { edicion?: [number, number, number] }): StudentHighlightedGame => {
  const [id, year, semester] = parcial.edicion ?? [4, 2026, 10];
  return {
    id: 1,
    name: "Ecos del Aula",
    teamName: "Los Pixeles",
    edition: { id, year, semester, title: `Feria Gamer ${year}` },
    logoUrl: null,
    hasGameFile: true,
    play: { type: "live", id: 431 },
    ...parcial,
  };
};

describe("editionLabel", () => {
  it("nombra la edición con el año y el semestre", () => {
    expect(editionLabel({ id: 4, year: 2026, semester: 10, title: "x" })).toBe("Feria 2026 · 1er semestre");
    expect(editionLabel({ id: 5, year: 2026, semester: 20, title: "x" })).toBe("Feria 2026 · Intersemestral");
    expect(editionLabel({ id: 3, year: 2025, semester: 30, title: "x" })).toBe("Feria 2025 · 2º semestre");
  });

  it("si el semestre no se conoce, usa el título de la edición", () => {
    expect(editionLabel({ id: 9, year: 2027, semester: 99, title: "Feria especial" })).toBe("Feria especial");
  });
});

describe("editionsOf", () => {
  it("lista cada edición una vez, de la más reciente a la más antigua", () => {
    const ediciones = editionsOf([
      juego({ id: 1, edicion: [3, 2025, 30] }),
      juego({ id: 2, edicion: [4, 2026, 10] }),
      juego({ id: 3, edicion: [3, 2025, 30] }),
      juego({ id: 4, edicion: [2, 2025, 10] }),
    ]);
    expect(ediciones.map((e) => e.id)).toEqual([4, 3, 2]);
  });

  it("sin destacados no hay ediciones", () => {
    expect(editionsOf([])).toEqual([]);
  });
});

describe("webPlay", () => {
  it("un juego vivo con zip se puede jugar en la cabina", () => {
    expect(webPlay(juego({}))).toBe("playable");
    expect(playerUrl(juego({}))).toBe("/play-game/431?embed=1");
  });

  it("sin zip no se puede jugar", () => {
    expect(webPlay(juego({ hasGameFile: false }))).toBe("noFile");
  });

  it("un juego histórico con zip se juega en su ruta de históricos (HU-40)", () => {
    const historico = juego({ play: { type: "historical", id: 87 } });
    expect(webPlay(historico)).toBe("playable");
    expect(playerUrl(historico)).toBe("/play-game/historical/87?embed=1");
  });
});
