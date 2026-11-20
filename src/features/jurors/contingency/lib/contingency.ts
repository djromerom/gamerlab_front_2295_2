import type {
  GroupJurorStatus,
  GroupSuggestion,
  JurorCategoryCode,
  SubstitutePair,
  SuggestionsResult,
} from "@/features/jurors/contingency/api/contingency";

/** HU-14 (ARK-214): textos y cálculos de la vista de contingencia, sin React. */

export const jurorStatusLabel: Record<GroupJurorStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Sin llegada",
  LEFT: "Se retiró",
};

export const categoryLabel = (category: JurorCategoryCode | null) =>
  category === "SENIOR" ? "Senior" : category === "JUNIOR" ? "Junior" : "Sin categoría";

/** N0 es colegios: solo lo califican seniors. */
export const levelLabel = (level: number | null) =>
  level === null ? "Sin nivel" : level === 0 ? "N0 · Colegios" : `N${level}`;

/** Pares de todos los sugeridos de todos los grupos (para «Aceptar todo»). */
export function allSuggestedPairs(groups: GroupSuggestion[]): SubstitutePair[] {
  return groups.flatMap((group) =>
    group.sugeridos.map((substitute) => ({ teamId: group.teamId, substituteId: substitute.id })),
  );
}

export function groupSuggestedPairs(group: GroupSuggestion): SubstitutePair[] {
  return group.sugeridos.map((substitute) => ({ teamId: group.teamId, substituteId: substitute.id }));
}

/**
 * Mensaje de un bloqueo al aceptar. El back dice qué suplente (`jurorId`) y qué grupo (`teamId`)
 * fallaron; con «Aceptar todo» el admin no sabría cuál es, así que se nombran.
 */
export function describeAcceptError(
  error: { message: string; code?: string; jurorId?: string; teamId?: number },
  groups: GroupSuggestion[],
): string {
  const group = groups.find((item) => item.teamId === error.teamId);
  const substitute = groups
    .flatMap((item) => [...item.sugeridos, ...item.alternativas])
    .find((item) => item.id === error.jurorId);
  if (!substitute && !group) return error.message;

  const where = group ? ` en ${group.codigo}` : "";
  if (error.code === "MISSING_JUROR_CATEGORY" && substitute) {
    return `No se pudo asignar a ${substitute.nombre}${where}: no tiene categoría (Junior o Senior). Asígnala en Personal → Jurados y vuelve a intentarlo. No se guardó ninguna asignación.`;
  }
  const who = substitute ? `${substitute.nombre}${where}` : group ? group.codigo : "";
  return `${who}: ${error.message}`;
}

export interface PhaseNotice {
  tone: "info" | "warning";
  text: string;
}

/**
 * Aviso según `fase` y `base`. Antes de la hora de control cuentan todos los asignados, porque
 * todavía pueden llegar; desde ella, solo los presentes.
 */
export function phaseNotice(
  result: Pick<SuggestionsResult, "fase" | "base">,
  controlTime?: string | null,
): PhaseNotice | null {
  if (result.fase === "NOT_CONFIGURED") {
    return {
      tone: "warning",
      text: "Falta configurar el cronograma de la feria. Mientras tanto se cuentan todos los jurados asignados.",
    };
  }
  if (result.base === "ASSIGNED") {
    const hour = controlTime ? ` (${controlTime})` : "";
    return {
      tone: "info",
      text: `Aún no es la hora de control${hour}: se cuentan todos los asignados, porque todavía pueden llegar.`,
    };
  }
  if (result.fase === "CLOSED") {
    return { tone: "info", text: "La feria ya cerró. Solo cuentan los jurados presentes o que ya evaluaron." };
  }
  return null;
}

export function validateMinimum(value: string, limits: { min: number; max: number }): string | null {
  if (!/^\d+$/.test(value.trim())) return "Escribe un número entero.";
  const number = Number(value);
  if (number < limits.min || number > limits.max) return `El mínimo debe estar entre ${limits.min} y ${limits.max}.`;
  return null;
}

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;
