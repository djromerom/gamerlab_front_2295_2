import { beforeEach, describe, expect, it } from "vitest";
import type { GradeTeam } from "@/components/grupo 5/student-grade-table-types";
import {
  clearGradeDraft,
  GRADE_DRAFT_KEY,
  isGradeModified,
  readGradeDraft,
  writeGradeDraft,
} from "@/lib/gradeDrafts";

const team: GradeTeam = {
  teamCode: "N1-AYP-01",
  nrc: "2501",
  teamName: "Los Pixeles",
  integrantes: ["Ana"],
  videogame: "Juego",
  calificacionFeria: null,
  calificacionDocente: 3,
  videogameId: 10,
  editionId: 3,
  canEdit: true,
};

beforeEach(() => localStorage.clear());

describe("gradeDrafts (BG-27)", () => {
  it("guarda y recupera las notas modificadas con su fila, la feria y el NRC", () => {
    expect(writeGradeDraft({ fair: "3", nrc: "7", grades: { k: "4.5" }, teams: { k: team } })).toBe(true);
    const draft = readGradeDraft();
    expect(draft).toMatchObject({ fair: "3", nrc: "7", grades: { k: "4.5" }, teams: { k: team } });
    expect(draft!.savedAt).toBeGreaterThan(0);
  });

  it("descarta notas sin fila y devuelve null si no queda ninguna", () => {
    localStorage.setItem(GRADE_DRAFT_KEY, JSON.stringify({ fair: "", nrc: "", grades: { k: "4", huerfana: "2" }, teams: { k: team } }));
    expect(Object.keys(readGradeDraft()!.grades)).toEqual(["k"]);

    localStorage.setItem(GRADE_DRAFT_KEY, JSON.stringify({ grades: { huerfana: "2" }, teams: {} }));
    expect(readGradeDraft()).toBeNull();
  });

  it("devuelve null con JSON corrupto o sin borrador", () => {
    expect(readGradeDraft()).toBeNull();
    localStorage.setItem(GRADE_DRAFT_KEY, "{no es json");
    expect(readGradeDraft()).toBeNull();
  });

  it("clearGradeDraft borra el borrador", () => {
    writeGradeDraft({ fair: "", nrc: "", grades: { k: "1" }, teams: { k: team } });
    clearGradeDraft();
    expect(localStorage.getItem(GRADE_DRAFT_KEY)).toBeNull();
  });

  it("isGradeModified compara lo escrito con la nota guardada", () => {
    expect(isGradeModified("3", 3)).toBe(false);
    expect(isGradeModified("3.00", 3)).toBe(false);
    expect(isGradeModified("3.5", 3)).toBe(true);
    expect(isGradeModified("", 3)).toBe(true);
    expect(isGradeModified(undefined, null)).toBe(false);
    expect(isGradeModified("4", null)).toBe(true);
    expect(isGradeModified("abc", 3)).toBe(true);
  });
});
