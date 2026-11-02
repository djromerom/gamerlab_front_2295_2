import { describe, expect, it } from "vitest";
import { buildAverageChartData, formatAverage } from "@/lib/averages";

describe("formatAverage", () => {
  it("formatea números con 2 decimales", () => {
    expect(formatAverage(4.256)).toBe("4.26");
    expect(formatAverage(0)).toBe("0.00");
  });
  it("devuelve null para null, undefined, NaN e Infinity", () => {
    expect(formatAverage(null)).toBeNull();
    expect(formatAverage(undefined)).toBeNull();
    expect(formatAverage(NaN)).toBeNull();
    expect(formatAverage(Infinity)).toBeNull();
  });
});

const vjs = [
  { materia: "Física", nrc: "101" },
  { materia: "Física", nrc: "102" },
];

describe("buildAverageChartData", () => {
  it("con números ordena de mayor a menor (sin regresión)", () => {
    const r = buildAverageChartData({
      materias: [{ name: "A", value: 3 }, { name: "B", value: 4.5 }],
      filtroMateria: "Todas", videojuegos: [], nrcs: [],
    });
    expect(r.hidden).toBe(false);
    expect(r.materias.map((m) => m.name)).toEqual(["A", "B"]);
    expect(r.chart).toEqual([{ name: "B", promedio: 4.5 }, { name: "A", promedio: 3 }]);
  });
  it("todas las materias en null: oculto y sin datos", () => {
    const r = buildAverageChartData({
      materias: [{ name: "A", value: null }, { name: "B", value: null }],
      filtroMateria: "Todas", videojuegos: [], nrcs: [],
    });
    expect(r.hidden).toBe(true);
    expect(r.materias).toEqual([]);
    expect(r.chart).toEqual([]);
  });
  it("algunas materias en null: se omiten sin 0 ni NaN", () => {
    const r = buildAverageChartData({
      materias: [{ name: "A", value: null }, { name: "B", value: 4 }],
      filtroMateria: "Todas", videojuegos: [], nrcs: [],
    });
    expect(r.hidden).toBe(false);
    expect(r.chart).toEqual([{ name: "B", promedio: 4 }]);
  });
  it("por NRC con números (sin regresión, incluye undefined como 0)", () => {
    const r = buildAverageChartData({
      materias: [], filtroMateria: "Física", videojuegos: vjs,
      nrcs: [{ codigo: 101, promedioxNRC: 3 }, { codigo: 102 }],
    });
    expect(r.hidden).toBe(false);
    expect(r.chart).toEqual([{ name: "101", promedio: 3 }, { name: "102", promedio: 0 }]);
  });
  it("por NRC todos en null: oculto", () => {
    const r = buildAverageChartData({
      materias: [], filtroMateria: "Física", videojuegos: vjs,
      nrcs: [{ codigo: 101, promedioxNRC: null }, { codigo: 102, promedioxNRC: null }],
    });
    expect(r.hidden).toBe(true);
    expect(r.chart).toEqual([]);
  });
  it("por NRC algunos en null: se omiten", () => {
    const r = buildAverageChartData({
      materias: [], filtroMateria: "Física", videojuegos: vjs,
      nrcs: [{ codigo: 101, promedioxNRC: null }, { codigo: 102, promedioxNRC: 2 }],
    });
    expect(r.hidden).toBe(false);
    expect(r.chart).toEqual([{ name: "102", promedio: 2 }]);
  });
  it("sin filas no es oculto", () => {
    const r = buildAverageChartData({ materias: [], filtroMateria: "Todas", videojuegos: [], nrcs: [] });
    expect(r.hidden).toBe(false);
  });
});

import { averageOfGames, isRankingHidden } from "@/lib/averages";

describe("isRankingHidden / averageOfGames", () => {
  it("lista sin claves promedio: oculto, sin promedio general", () => {
    const l = [{ id: 1 }, { id: 2, promedio: undefined }];
    expect(isRankingHidden(l)).toBe(true);
    expect(averageOfGames(l)).toBeNull();
  });
  it("lista vacía no es oculta", () => {
    expect(isRankingHidden([])).toBe(false);
  });
  it("con números promedia (sin regresión)", () => {
    const l = [{ promedio: 4 }, { promedio: 3 }];
    expect(isRankingHidden(l)).toBe(false);
    expect(averageOfGames(l)).toBe("3.50");
  });
  it("mezcla: promedia solo los numéricos, sin NaN", () => {
    expect(averageOfGames([{ promedio: 4 }, {}])).toBe("4.00");
  });
});
