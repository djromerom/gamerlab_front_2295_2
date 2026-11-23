import { describe, expect, it } from "vitest";
import type { LevelTeam } from "./manualAssignment";
import {
  MAX_BULK_TEAMS,
  getBlockedTeams,
  markVisible,
  mixedLevelsNotice,
  resultTone,
  statusLabel,
  teamDisplayName,
  toggleTeamId,
} from "./bulkAssignment";

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

const colegio = team({ id: 18, name: "Colegio Demo", teamCode: "N0-COLEGIOS-01", level: 0, levelLabel: "Colegios" });
const pixeles = team({ id: 12, name: "Los Pixeles", teamCode: "N1-AYP-06" });
const byte = team({ id: 15, name: "Byte Club", teamCode: "N1-AYP-07" });
const nivel2 = team({ id: 20, name: "Equipo Dos", teamCode: "N2-AYP-01", level: 2, levelLabel: "Nivel 2" });

describe("bulkAssignment (HU-42, ARK-276)", () => {
  describe("getBlockedTeams", () => {
    it("lee los equipos bloqueados del 409 en lote", () => {
      expect(
        getBlockedTeams({
          code: "ASSIGNMENT_WARNINGS",
          blocked: [
            { teamId: 18, codigo: "N0-COLEGIOS-01", code: "SCHOOL_REQUIRES_SENIOR", message: "Solo senior." },
            { teamId: 99, codigo: null, code: "TEAM_NOT_FOUND", message: "No existe." },
          ],
        })
      ).toEqual([
        { teamId: 18, codigo: "N0-COLEGIOS-01", code: "SCHOOL_REQUIRES_SENIOR", message: "Solo senior." },
        { teamId: 99, codigo: null, code: "TEAM_NOT_FOUND", message: "No existe." },
      ]);
    });

    it("devuelve vacío si no viene `blocked` (p. ej. el 409 de un solo equipo) o viene mal", () => {
      expect(getBlockedTeams({ code: "ASSIGNMENT_WARNINGS", warnings: [] })).toEqual([]);
      expect(getBlockedTeams(null)).toEqual([]);
      expect(getBlockedTeams({ blocked: [{ codigo: "X" }, null] })).toEqual([]);
    });
  });

  describe("teamDisplayName", () => {
    it("usa el código y el nombre del back", () => {
      expect(teamDisplayName(12, { codigo: "N1-AYP-06", nombre: "Los Pixeles" }, [])).toBe("N1-AYP-06 · Los Pixeles");
    });

    it("si el back los manda en null, usa los de la lista de casillas", () => {
      expect(teamDisplayName(18, { codigo: null, nombre: null }, [colegio])).toBe("N0-COLEGIOS-01 · Colegio Demo");
    });

    it("sin datos en ningún lado muestra el id", () => {
      expect(teamDisplayName(77, { codigo: null, nombre: null }, [])).toBe("Equipo 77");
    });
  });

  it("statusLabel nombra los tres estados en español", () => {
    expect(statusLabel("ASSIGNED")).toBe("Asignado");
    expect(statusLabel("ASSIGNED_WITH_WARNINGS")).toBe("Asignado con advertencia aceptada");
    expect(statusLabel("BLOCKED")).toBe("No se asignó");
  });

  it("resultTone distingue todo asignado, parcial y nada asignado", () => {
    expect(resultTone({ solicitados: 2, asignados: 2, bloqueados: 0 })).toBe("success");
    expect(resultTone({ solicitados: 3, asignados: 2, bloqueados: 1 })).toBe("partial");
    expect(resultTone({ solicitados: 3, asignados: 0, bloqueados: 3 })).toBe("none");
  });

  describe("marcar equipos", () => {
    it("toggleTeamId marca y desmarca", () => {
      expect(toggleTeamId([], 12)).toEqual([12]);
      expect(toggleTeamId([12, 15], 12)).toEqual([15]);
    });

    it(`toggleTeamId no deja pasar de ${MAX_BULK_TEAMS}, pero sí desmarcar`, () => {
      const full = Array.from({ length: MAX_BULK_TEAMS }, (_, i) => i + 1);
      expect(toggleTeamId(full, 999)).toBe(full);
      expect(toggleTeamId(full, 1)).toHaveLength(MAX_BULK_TEAMS - 1);
    });

    it("markVisible suma solo los visibles que el jurado aún no tiene, sin repetir", () => {
      expect(markVisible([15], [pixeles, byte, colegio], new Set([18]))).toEqual([15, 12]);
    });

    it(`markVisible se detiene en ${MAX_BULK_TEAMS}`, () => {
      const many = Array.from({ length: 60 }, (_, i) => team({ id: i + 1 }));
      expect(markVisible([], many, new Set())).toHaveLength(MAX_BULK_TEAMS);
    });
  });

  describe("mixedLevelsNotice", () => {
    it("sin mezcla de niveles no avisa", () => {
      expect(mixedLevelsNotice([pixeles, byte], [1])).toBeNull();
      expect(mixedLevelsNotice([pixeles, byte], [])).toBeNull();
      expect(mixedLevelsNotice([], [1])).toBeNull();
    });

    it("con un equipo de otro nivel lo nombra", () => {
      expect(mixedLevelsNotice([pixeles, nivel2], [1])).toContain(
        "«Equipo Dos» es de Nivel 2 y el jurado ya tiene Nivel 1"
      );
    });

    it("con varios equipos de otro nivel los lista con su nivel", () => {
      expect(mixedLevelsNotice([nivel2, colegio], [1])).toContain(
        "«Equipo Dos» (Nivel 2), «Colegio Demo» (Colegios) son de otro nivel y el jurado ya tiene Nivel 1"
      );
    });

    it("si el jurado no tiene equipos, avisa cuando los marcados mezclan niveles", () => {
      expect(mixedLevelsNotice([nivel2, pixeles, colegio], [])).toContain(
        "Los equipos marcados son de varios niveles (Colegios, Nivel 1, Nivel 2)"
      );
    });
  });
});
