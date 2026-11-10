export interface GradeTeam {
  teamCode: string;
  nrc: string | null;
  teamName: string;
  integrantes: string[] | string;
  videogame: string;
  calificacionFeria: number | null;
  calificacionDocente: number | null;
  videogameId: string | number | null;
  editionId?: string | number | null;
  editionLabel?: string;
  nrcId?: string | number | null;
  canEdit?: boolean;
  source?: "current" | "historical";
  /** Con qué regla calcula el backend la nota de la feria (BG-37). */
  fairGradeRule?: FairGradeRule;
}

/**
 * BG-37 / ARK-203: `EXTERNAL`, en un equipo externo solo cuentan los jurados junior;
 * `SCHOOL`, un colegio (N0) solo cuenta a profesores y jurados senior; `STANDARD`, los demás.
 */
export type FairGradeRule = "STANDARD" | "EXTERNAL" | "SCHOOL";

/** Motivo que se le muestra al profesor cuando la nota de la feria se calcula distinto. */
export const FAIR_GRADE_RULE_REASON: Record<Exclude<FairGradeRule, "STANDARD">, string> = {
  EXTERNAL: "Equipo externo: la nota de la feria solo cuenta los jurados junior",
  SCHOOL: "Colegio: la nota de la feria se calcula solo con las notas de profesores y jurados senior",
};

/**
 * Normaliza `fairGradeRule` de `grading-games`. Si el backend no lo envía (versión anterior a
 * BG-37) se deduce de `isExternal`; cualquier otro valor cuenta como `STANDARD`.
 */
export function toFairGradeRule(rule: unknown, isExternal?: unknown): FairGradeRule {
  if (rule === "EXTERNAL" || rule === "SCHOOL" || rule === "STANDARD") return rule;
  return rule == null && isExternal === true ? "EXTERNAL" : "STANDARD";
}

export function gradeKey(team: GradeTeam) {
  return `${team.editionId ?? "edition"}:${team.teamCode}:${team.videogameId ?? "game"}`;
}

export function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}
