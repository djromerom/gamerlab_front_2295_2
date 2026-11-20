/**
 * ARK-249 (BG-43): reglas de los puntajes de una evaluación.
 * Un criterio vacío no es un 0: hay que calificarlo. El 0 cuenta solo si el jurado lo escribe.
 */

export interface ScoredCriterion {
  id: number;
  name: string;
  score: string | number;
  maxScore: number;
}

/** Puntaje escrito por el jurado; `null` si está vacío o no es un número. */
export function parseCriterionScore(value: string | number | null | undefined, maxScore: number): number | null {
  const raw = value === null || value === undefined ? "" : String(value);
  if (!raw.trim()) return null;
  const parsed = Number.parseFloat(raw.replace(/,/g, "."));
  if (Number.isNaN(parsed)) return null;
  if (parsed < 0) return 0;
  if (parsed > maxScore) return maxScore;
  return parsed;
}

/** Criterios que todavía no tienen puntaje, en el orden en que aparecen. */
export function findMissingCriteria<T extends ScoredCriterion>(criteria: T[]): T[] {
  return criteria.filter((criterion) => parseCriterionScore(criterion.score, criterion.maxScore) === null);
}

/** id del campo de un criterio, para llevar el foco al primero que falta. */
export const criterionScoreInputId = (criterionId: number) => `criterion-score-${criterionId}`;

export const MISSING_CRITERIA_MESSAGE = "Califica todos los criterios antes de enviar";

/** «Califica todos los criterios antes de enviar. Falta: Jugabilidad.» */
export function missingCriteriaMessage(missing: Pick<ScoredCriterion, "name">[]): string {
  if (missing.length === 0) return "";
  const names = missing.map((criterion) => `«${criterion.name}»`).join(", ");
  return `${MISSING_CRITERIA_MESSAGE}. ${missing.length === 1 ? "Falta" : "Faltan"}: ${names}.`;
}

/** Lo que se muestra junto al campo: «—» si está vacío, para no confundir un vacío con 0.00. */
export function formatCriterionScore(value: string | number, maxScore: number): string {
  const parsed = parseCriterionScore(value, maxScore);
  return parsed === null ? "—" : parsed.toFixed(2);
}

/**
 * Mensaje legible de un error del back. El 400 de validación trae `message` como arreglo,
 * con la ruta del campo delante (`details.0.…` o `evaluations.1.details.0.…`).
 */
export function apiErrorMessage(data: unknown, fallback: string): string {
  const message = (data as { message?: unknown } | null)?.message;
  const parts = (Array.isArray(message) ? message : [message])
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .map((part) => part.replace(/^(?:[A-Za-z]+\.\d+\.)+/, ""));
  return parts.length > 0 ? [...new Set(parts)].join(" ") : fallback;
}
