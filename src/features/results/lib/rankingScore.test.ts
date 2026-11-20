import { describe, expect, it } from "vitest";
import {
  formatFinalScore,
  hasFinalScore,
  missingScoreMessage,
  splitByFinalScore,
} from "@/features/results/lib/rankingScore";

describe("nota final en el ranking (ARK-238)", () => {
  it("null y undefined no son nota; 0 sí lo es", () => {
    expect(hasFinalScore(null)).toBe(false);
    expect(hasFinalScore(undefined)).toBe(false);
    expect(hasFinalScore(Number.NaN)).toBe(false);
    expect(hasFinalScore(0)).toBe(true);
    expect(hasFinalScore(4.5)).toBe(true);
  });

  it("formatea con 2 decimales o «Sin nota», nunca 0.00 por un null", () => {
    expect(formatFinalScore(4.5)).toBe("4.50");
    expect(formatFinalScore(0)).toBe("0.00");
    expect(formatFinalScore(null)).toBe("Sin nota");
  });

  it("explica qué nota falta; sin detalle dice «Nota en proceso»", () => {
    expect(missingScoreMessage(["PROFESSOR", "JUROR"])).toBe("Faltan las dos notas");
    expect(missingScoreMessage(["PROFESSOR"])).toBe("Falta la nota de profesores");
    expect(missingScoreMessage(["JUROR"])).toBe("Falta la nota de jurados");
    expect(missingScoreMessage()).toBe("Nota en proceso");
  });

  it("separa a los equipos sin nota y conserva el orden de los dos grupos", () => {
    const teams = [
      { id: 1, finalScore: 4.4 },
      { id: 2, finalScore: null },
      { id: 3, finalScore: 0 },
      { id: 4, finalScore: null },
    ];
    const { scored, unscored } = splitByFinalScore(teams);
    expect(scored.map((t) => t.id)).toEqual([1, 3]);
    expect(unscored.map((t) => t.id)).toEqual([2, 4]);
  });
});
