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
  /** BG-43 (ARK-205): inscripción rechazada; no tiene nota de feria mientras lo esté. */
  rejected?: boolean;
}

/**
 * BG-37 / ARK-203: `SCHOOL`, un colegio (N0) solo cuenta a profesores y jurados senior;
 * `STANDARD`, los demás. ARK-272/273: la casilla «Externo» ya no cambia la nota, así que el back
 * ya no envía `EXTERNAL`.
 */
export type FairGradeRule = "STANDARD" | "SCHOOL";

/** Motivo que se le muestra al profesor cuando la nota de la feria se calcula distinto. */
export const FAIR_GRADE_RULE_REASON: Record<Exclude<FairGradeRule, "STANDARD">, string> = {
  SCHOOL: "Colegio: la nota de la feria se calcula solo con las notas de profesores y jurados senior",
};

/** Normaliza `fairGradeRule` de `grading-games`: cualquier valor que no sea `SCHOOL` cuenta como `STANDARD`. */
export function toFairGradeRule(rule: unknown): FairGradeRule {
  return rule === "SCHOOL" ? "SCHOOL" : "STANDARD";
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
