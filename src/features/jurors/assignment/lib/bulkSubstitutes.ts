/**
 * HU-09 (ARK-216): reglas del diálogo «Cubrir jurados con suplentes». Lógica pura para probarla
 * sin pantalla: qué jurados se pueden cubrir, quiénes son suplentes y qué se le dice al admin.
 */
import {
  MAX_COVERED_JURORS,
  MAX_SUBSTITUTES,
  type BulkSubstituteAssignmentResult,
  type EditionEvaluator,
} from "@/features/jurors/assignment/api/bulkSubstitutes";

export const fullName = (e: Pick<EditionEvaluator, "firstName" | "lastName" | "email">) =>
  `${e.firstName} ${e.lastName}`.trim() || e.email;

const byName = (a: EditionEvaluator, b: EditionEvaluator) => fullName(a).localeCompare(fullName(b), "es");

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const groupsText = (n: number) => plural(n, "grupo", "grupos");

/**
 * Jurados a cubrir: los que tienen grupos en la edición (sin grupos no hay nada que cubrir), con
 * más grupos primero. Suplentes: tipo Suplente de la edición que no son profesores (contrato).
 */
export function splitCandidates(evaluators: EditionEvaluator[]) {
  const coverable = evaluators
    .filter((e) => e.assignedTeams > 0)
    .sort((a, b) => b.assignedTeams - a.assignedTeams || byName(a, b));
  const substitutes = evaluators.filter((e) => e.jurorType === "BACKUP" && !e.isProfessor).sort(byName);
  return { coverable, substitutes };
}

export function evaluatorRole(e: EditionEvaluator): string {
  if (e.isProfessor) return "Profesor";
  return e.jurorType === "BACKUP" ? "Suplente" : "Oficial";
}

export function categoryLabel(e: EditionEvaluator): string {
  if (e.jurorCategory === "SENIOR") return "Senior";
  if (e.jurorCategory === "JUNIOR") return "Junior";
  return "Sin categoría";
}

export const matchesSearch = (e: EditionEvaluator, term: string) => {
  const q = term.trim().toLowerCase();
  return !q || fullName(e).toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
};

/** Por qué todavía no se puede confirmar; null si se puede. */
export function selectionProblem(jurorIds: string[], substituteIds: string[]): string | null {
  if (jurorIds.length === 0) return "Elige al menos un jurado a cubrir.";
  if (substituteIds.length === 0) return "Elige al menos un suplente.";
  if (jurorIds.length > MAX_COVERED_JURORS) return `Puedes cubrir hasta ${MAX_COVERED_JURORS} jurados a la vez.`;
  if (substituteIds.length > MAX_SUBSTITUTES) return `Puedes elegir hasta ${MAX_SUBSTITUTES} suplentes a la vez.`;
  if (jurorIds.some((id) => substituteIds.includes(id)))
    return "Una misma persona no puede ser jurado a cubrir y suplente.";
  return null;
}

/**
 * «Se sumarán 2 suplentes a hasta 5 grupos de 2 jurados.» Es «hasta» porque dos jurados pueden
 * compartir grupo y porque los grupos sin confirmar o no calificables se omiten.
 */
export function coverageSummary(covered: EditionEvaluator[], substitutes: EditionEvaluator[]): string {
  const groups = covered.reduce((sum, e) => sum + e.assignedTeams, 0);
  return `Se sumará${substitutes.length === 1 ? "" : "n"} ${plural(substitutes.length, "suplente", "suplentes")} a hasta ${groupsText(groups)} de ${plural(covered.length, "jurado", "jurados")}.`;
}

const UNASSIGNABLE_REASON: Record<string, string> = {
  TEAM_NOT_CONFIRMED: "sin confirmar",
  TEAM_NOT_GRADABLE: "presentador externo, no se califica",
};

/** Notas del resultado que el admin debe leer: grupos omitidos y jurados sin grupos. */
export function resultNotes(result: BulkSubstituteAssignmentResult): string[] {
  const notes: string[] = [];
  if (result.equiposNoAsignables.length > 0) {
    const list = result.equiposNoAsignables
      .map((t) => `${t.codigo} ${t.nombre} (${UNASSIGNABLE_REASON[t.motivo] ?? t.motivo})`)
      .join("; ");
    notes.push(`No se asignaron estos grupos: ${list}.`);
  }
  if (result.juradosSinGrupos.length > 0) {
    notes.push(`No tenían grupos en la edición activa: ${result.juradosSinGrupos.map((j) => j.nombre).join(", ")}.`);
  }
  return notes;
}
