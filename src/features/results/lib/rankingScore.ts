/**
 * Nota final de un equipo en el ranking (HU-04, ARK-238).
 * Un equipo sin nota final (`finalScore: null`) no tiene posición: no va al podio ni se numera,
 * y no se muestra como 0.00. Lo usan el podio del administrador (RankingGroupCard) y /ranking.
 */

export type MissingScore = "PROFESSOR" | "JUROR";

/** `true` si el equipo ya tiene nota final. */
export function hasFinalScore(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Nota con 2 decimales, o «Sin nota». */
export function formatFinalScore(value: number | null | undefined): string {
  return hasFinalScore(value) ? value.toFixed(2) : "Sin nota";
}

/** Por qué un equipo todavía no tiene nota final. Sin detalle (vista pública): «Nota en proceso». */
export function missingScoreMessage(missing?: MissingScore[]): string {
  if (missing?.length === 2) return "Faltan las dos notas";
  if (missing?.includes("PROFESSOR")) return "Falta la nota de profesores";
  if (missing?.includes("JUROR")) return "Falta la nota de jurados";
  return "Nota en proceso";
}

/** Separa los equipos con nota de los que no tienen, sin cambiar el orden en que llegaron. */
export function splitByFinalScore<T extends { finalScore: number | null }>(teams: T[]) {
  const scored: (T & { finalScore: number })[] = [];
  const unscored: T[] = [];
  for (const team of teams) {
    if (hasFinalScore(team.finalScore)) scored.push(team as T & { finalScore: number });
    else unscored.push(team);
  }
  return { scored, unscored };
}
