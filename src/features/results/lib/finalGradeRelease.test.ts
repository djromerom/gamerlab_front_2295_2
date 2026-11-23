import { describe, expect, it } from "vitest";
import type { FinalGradeRelease } from "@/features/results/api/finalGrade";
import {
  formatFairDate,
  inProcessConfirmMessage,
  inProcessTeams,
  isReleaseLocked,
  releasedAtMessage,
  releaseLockedMessage,
} from "@/features/results/lib/finalGradeRelease";

const base: FinalGradeRelease = {
  editionId: 5,
  editionTitle: "Feria Gamer 2026-2",
  showFinalGrade: false,
  releasedAt: null,
  fairDate: "2026-11-26",
  releaseTime: "12:00",
  timeZone: "America/Bogota",
  scheduleConfigured: true,
  releaseAllowedFrom: "2026-11-26T17:00:00.000Z",
  canReleaseNow: false,
  summary: { totalTeams: 40, withFinalGrade: 37, inProcess: 2, lessThanMinEvaluations: 5 },
  incompleteTeams: [
    { teamId: 301, teamCode: "N2-ISI-014", teamName: "Pixel", videogameName: "Stella", finalScore: 4.1, juniorEvaluations: 2, seniorEvaluations: 0, inProcess: true, reasons: ["MISSING_PROFESSOR_SCORE"] },
    { teamId: 302, teamCode: "N2-ISI-015", teamName: "Byte", videogameName: "Nova", finalScore: 3.9, juniorEvaluations: 2, seniorEvaluations: 1, inProcess: false, reasons: ["LESS_THAN_MIN_EVALUATIONS"] },
    { teamId: 303, teamCode: "N3-ISI-020", teamName: "Glitch", videogameName: "Orbit", finalScore: null, juniorEvaluations: 0, seniorEvaluations: 0, inProcess: true, reasons: ["MISSING_JUNIOR_SCORE"] },
  ],
};

describe("finalGradeRelease (HU-46)", () => {
  it("la fecha de la feria se muestra tal cual, sin convertir zonas", () => {
    expect(formatFairDate("2026-11-26")).toBe("26/11/2026");
    expect(formatFairDate(null)).toBeNull();
    expect(formatFairDate("mal")).toBeNull();
  });

  it("A1: oculta y antes de la hora queda bloqueada con la hora de cierre", () => {
    expect(isReleaseLocked(base)).toBe(true);
    expect(releaseLockedMessage(base)).toBe("Se puede activar desde las 12:00 del 26/11/2026 (hora de Colombia).");
    expect(releaseLockedMessage({ ...base, fairDate: null })).toBe("Se puede activar desde las 12:00 (hora de Colombia).");
  });

  it("después de la hora o ya liberada no se bloquea (ocultar siempre se puede)", () => {
    expect(isReleaseLocked({ ...base, canReleaseNow: true })).toBe(false);
    expect(isReleaseLocked({ ...base, showFinalGrade: true, canReleaseNow: false })).toBe(false);
  });

  it("la fecha de liberación va en hora de Bogotá", () => {
    expect(releasedAtMessage("2026-11-26T17:05:00.000Z")).toMatch(/^Liberada el 26\/11\/2026.*12:05.*\(hora de Colombia\)\.$/);
    expect(releasedAtMessage(null)).toBeNull();
    expect(releasedAtMessage("no-es-fecha")).toBeNull();
  });

  it("A2: pide confirmar solo si hay equipos en proceso, y lista solo esos", () => {
    expect(inProcessConfirmMessage(base)).toBe(
      "Hay 2 equipos con la nota en proceso. Verán «Nota en proceso» en lugar de la nota. ¿Liberar de todos modos?",
    );
    expect(inProcessTeams(base).map((t) => t.teamId)).toEqual([301, 303]);
    expect(inProcessConfirmMessage({ ...base, summary: { ...base.summary, inProcess: 1 } })).toMatch(/^Hay 1 equipo con la nota en proceso\. Verá «/);
    expect(inProcessConfirmMessage({ ...base, summary: { ...base.summary, inProcess: 0 } })).toBeNull();
  });
});
