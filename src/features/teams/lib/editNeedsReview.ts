/**
 * BG-38 (ARK-161, ARK-255): ¿la edición del estudiante devuelve el juego a PENDIENTE?
 * Igual que `studentEditNeedsReview` del back (`teams/student-edit-policy.ts`): solo si cambia el
 * nombre del equipo (sin contar espacios de los extremos) o se sube un logo nuevo. Editar la
 * descripción, el video, el repositorio o las fotos no lo devuelve. Lo que edita el
 * Administrador nunca vuelve a revisión.
 */
export interface TeamEditReviewInput {
  isAdmin: boolean;
  originalTeamName: string | null | undefined;
  teamName: string | null | undefined;
  newLogo: boolean;
}

export type TeamEditReviewReason = "teamName" | "logo";

export function teamEditReviewReasons(input: TeamEditReviewInput): TeamEditReviewReason[] {
  if (input.isAdmin) return [];
  const reasons: TeamEditReviewReason[] = [];
  if ((input.teamName ?? "").trim() !== (input.originalTeamName ?? "").trim()) reasons.push("teamName");
  if (input.newLogo) reasons.push("logo");
  return reasons;
}

/** «el nombre del equipo», «el logo» o «el nombre del equipo y el logo». */
export function describeReviewReasons(reasons: TeamEditReviewReason[]): string {
  const labels = reasons.map((reason) => (reason === "teamName" ? "el nombre del equipo" : "el logo"));
  return labels.join(" y ");
}
