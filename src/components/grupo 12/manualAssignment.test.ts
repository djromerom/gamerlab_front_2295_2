import { describe, expect, it } from "vitest";
import {
  ALL_LEVELS,
  type LevelTeam,
  filterTeams,
  groupByLevel,
  isOtherLevel,
  jurorLevels,
  levelFilterOptions,
  teamLevelLabel,
  toLevelTeam,
} from "./manualAssignment";

const team = (overrides: Partial<LevelTeam>): LevelTeam => ({
  id: 1,
  name: "Equipo",
  videogame: "Juego",
  teamCode: "N1-ABC-001",
  level: 1,
  levelLabel: "Nivel 1",
  jurorCount: 0,
  ...overrides,
});

const colegios = team({ id: 500, name: "Equipo Épsilon", videogame: "Juego Epsilon", teamCode: "N0-ABC-001", level: 0, levelLabel: "Colegios" });
const delta = team({ id: 400, name: "Equipo Delta", videogame: "Juego Delta", teamCode: "N2-ABC-201", level: 2, levelLabel: "Nivel 2", jurorCount: 1 });
const alpha = team({ id: 100, name: "Equipo Alpha", videogame: "Aventura", teamCode: "N1-XYZ-010", level: 1, levelLabel: "Nivel 1" });
const sinNivel = team({ id: 900, name: "Equipo Raro", videogame: "Otro", teamCode: "ABC-1", level: null, levelLabel: "Sin nivel" });
const lista = [colegios, alpha, delta, sinNivel];

describe("manualAssignment (ARK-189)", () => {
  describe("toLevelTeam", () => {
    it("toma el nivel y la etiqueta que manda el back en incomplete-jurors", () => {
      expect(
        toLevelTeam({
          id: 400,
          nombre: "Equipo Delta Mock",
          teamCode: "N2-ABC-201",
          nivel: 2,
          nivelEtiqueta: "Nivel 2",
          videojuego: "Juego Delta",
          cantidadJurados: 1,
        })
      ).toEqual({
        id: 400,
        name: "Equipo Delta Mock",
        videogame: "Juego Delta",
        teamCode: "N2-ABC-201",
        level: 2,
        levelLabel: "Nivel 2",
        jurorCount: 1,
      });
    });

    it("lee el videojuego como objeto, como lo manda /juror/:id/teams", () => {
      const result = toLevelTeam({
        id: 1,
        nombre: "A",
        teamCode: "N0-X",
        nivel: 0,
        nivelEtiqueta: "Colegios",
        videojuego: { id: 3, nombre: "Juego A", descripcion: "" },
      });
      expect(result.videogame).toBe("Juego A");
      expect(result.levelLabel).toBe("Colegios");
    });

    it("respeta nivel null del back y usa «Sin nivel»", () => {
      const result = toLevelTeam({ id: 1, nombre: "A", teamCode: "RARO", nivel: null, nivelEtiqueta: "Sin nivel" });
      expect(result.level).toBeNull();
      expect(result.levelLabel).toBe("Sin nivel");
    });

    it("si el back todavía no manda el nivel, lo saca del código con la misma regla", () => {
      const result = toLevelTeam({ id: 1, nombre: "A", teamCode: "n3-abc", videojuego: "J" });
      expect(result.level).toBe(3);
      expect(result.levelLabel).toBe("Nivel 3");
      expect(toLevelTeam({ id: 2, nombre: "B" }).levelLabel).toBe("Sin nivel");
    });
  });

  it("teamLevelLabel nombra colegios, niveles y sin nivel como el back", () => {
    expect(teamLevelLabel(0)).toBe("Colegios");
    expect(teamLevelLabel(4)).toBe("Nivel 4");
    expect(teamLevelLabel(null)).toBe("Sin nivel");
  });

  describe("filterTeams", () => {
    it("sin búsqueda ni filtro devuelve todos", () => {
      expect(filterTeams(lista, "", ALL_LEVELS)).toEqual(lista);
    });

    it("busca por nombre sin distinguir tildes ni mayúsculas", () => {
      expect(filterTeams(lista, "EPSILON", ALL_LEVELS)).toEqual([colegios]);
      expect(filterTeams(lista, "épsilon", ALL_LEVELS)).toEqual([colegios]);
    });

    it("busca también por videojuego y por código", () => {
      expect(filterTeams(lista, "aventura", ALL_LEVELS)).toEqual([alpha]);
      expect(filterTeams(lista, "n2-abc", ALL_LEVELS)).toEqual([delta]);
    });

    it("filtra por nivel, colegios y sin nivel", () => {
      expect(filterTeams(lista, "", "2")).toEqual([delta]);
      expect(filterTeams(lista, "", "0")).toEqual([colegios]);
      expect(filterTeams(lista, "", "none")).toEqual([sinNivel]);
    });

    it("combina búsqueda y nivel", () => {
      expect(filterTeams(lista, "equipo", "1")).toEqual([alpha]);
      expect(filterTeams(lista, "delta", "1")).toEqual([]);
    });
  });

  it("levelFilterOptions ofrece solo los niveles de la lista, en orden y «Sin nivel» al final", () => {
    expect(levelFilterOptions([sinNivel, delta, colegios, alpha, delta])).toEqual([
      { value: "0", label: "Colegios" },
      { value: "1", label: "Nivel 1" },
      { value: "2", label: "Nivel 2" },
      { value: "none", label: "Sin nivel" },
    ]);
  });

  it("groupByLevel agrupa por nivel para los optgroup", () => {
    expect(groupByLevel([alpha, delta, colegios])).toEqual([
      { level: 0, label: "Colegios", teams: [colegios] },
      { level: 1, label: "Nivel 1", teams: [alpha] },
      { level: 2, label: "Nivel 2", teams: [delta] },
    ]);
  });

  describe("niveles del jurado", () => {
    it("jurorLevels toma los niveles distintos e ignora los sin nivel", () => {
      expect(jurorLevels([delta, alpha, delta, sinNivel])).toEqual([1, 2]);
    });

    it("isOtherLevel marca los equipos de un nivel que el jurado no tiene", () => {
      expect(isOtherLevel(delta, [1])).toBe(true);
      expect(isOtherLevel(alpha, [1])).toBe(false);
      expect(isOtherLevel(colegios, [1])).toBe(true);
    });

    it("isOtherLevel no marca nada si el jurado no tiene equipos o el equipo no tiene nivel", () => {
      expect(isOtherLevel(delta, [])).toBe(false);
      expect(isOtherLevel(sinNivel, [1])).toBe(false);
    });
  });
});
