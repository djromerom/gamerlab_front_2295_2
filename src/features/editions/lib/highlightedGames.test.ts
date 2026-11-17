import { describe, expect, it } from "vitest";
import {
  availableGames,
  fromHighlighted,
  fromHistoricalCatalog,
  fromLiveCatalog,
  gameKey,
  type SelectorGame,
} from "@/features/editions/lib/highlightedGames";

const hist = (id: number, name: string, hasGameFile: boolean): SelectorGame => ({ kind: "historical", id, name, hasGameFile });
const live = (id: number, name: string): SelectorGame => ({ kind: "live", id, name, hasGameFile: null });

describe("conversiones", () => {
  it("un histórico tiene zip solo si gameFileUrl trae valor", () => {
    expect(
      fromHistoricalCatalog([
        { id: 1, name: "A", gameFileUrl: "https://zip" },
        { id: 2, name: "B", gameFileUrl: "  " },
        { id: 3, name: "C", gameFileUrl: null },
        { id: 4, name: "D" },
      ]).map((g) => g.hasGameFile),
    ).toEqual([true, false, false, false]);
  });

  it("el catálogo en vivo no sabe si hay zip", () => {
    expect(fromLiveCatalog([{ id: 5, name: "E", teamName: "T" }])).toEqual([
      { kind: "live", id: 5, name: "E", teamName: "T", hasGameFile: null },
    ]);
  });

  it("los destacados toman el tipo y el id de play", () => {
    const [g] = fromHighlighted([
      {
        id: 15,
        name: "Ruta 66",
        teamName: "Byte Club",
        edition: { id: 3, year: 2025, semester: 30, title: "" },
        logoUrl: null,
        hasGameFile: true,
        play: { type: "historical", id: 87 },
      },
    ]);
    expect(g).toEqual({ kind: "historical", id: 87, name: "Ruta 66", teamName: "Byte Club", hasGameFile: true });
  });

  it("la clave distingue un id vivo de uno histórico", () => {
    expect(gameKey(live(7, "x"))).not.toBe(gameKey(hist(7, "x", false)));
  });
});

describe("availableGames", () => {
  const catalog = [hist(1, "Zeta", false), hist(2, "Alfa", true), hist(3, "Beta", true), hist(4, "Ecos del Aula", true)];

  it("quita los ya destacados y ordena con zip primero y luego por nombre", () => {
    const res = availableGames(catalog, [hist(3, "Beta", true)]);
    expect(res.map((g) => g.name)).toEqual(["Alfa", "Ecos del Aula", "Zeta"]);
  });

  it("no ofrece la versión histórica de un juego destacado en vivo (mismo nombre, sin tildes ni mayúsculas)", () => {
    const res = availableGames(catalog, [live(431, "ecos del aulá ")]);
    expect(res.map((g) => g.id)).not.toContain(4);
  });

  it("un destacado en vivo con el mismo id que un histórico no lo oculta", () => {
    const res = availableGames(catalog, [live(2, "Otro juego")]);
    expect(res.map((g) => g.id)).toContain(2);
  });

  it("filtra por nombre y por zip", () => {
    expect(availableGames(catalog, [], { search: "et" }).map((g) => g.name)).toEqual(["Beta", "Zeta"]);
    expect(availableGames(catalog, [], { onlyWithZip: true }).map((g) => g.name)).toEqual(["Alfa", "Beta", "Ecos del Aula"]);
  });
});
