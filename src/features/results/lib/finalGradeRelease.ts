import type { FinalGradeRelease, IncompleteFinalGradeTeam } from "@/features/results/api/finalGrade";

/** «2026-11-26» → «26/11/2026», tal cual llega (sin convertir zonas horarias). */
export function formatFairDate(fairDate: string | null): string | null {
  if (!fairDate) return null;
  const [year, month, day] = fairDate.split("-");
  if (!year || !month || !day) return null;
  return `${day}/${month}/${year}`;
}

/** La nota oculta solo se puede liberar desde la hora de cierre de la feria (HU-46 A1). Ocultarla siempre se puede. */
export function isReleaseLocked(release: FinalGradeRelease): boolean {
  return !release.showFinalGrade && !release.canReleaseNow;
}

/** «Se puede activar desde las 12:00 del 26/11/2026 (hora de Colombia).» */
export function releaseLockedMessage(release: FinalGradeRelease): string {
  const date = formatFairDate(release.fairDate);
  return `Se puede activar desde las ${release.releaseTime}${date ? ` del ${date}` : ""} (hora de Colombia).`;
}

/** «Liberada el 26/11/2026, 12:05 p. m. (hora de Colombia).» */
export function releasedAtMessage(releasedAt: string | null): string | null {
  if (!releasedAt) return null;
  const date = new Date(releasedAt);
  if (Number.isNaN(date.getTime())) return null;
  const text = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(date);
  return `Liberada el ${text} (hora de Colombia).`;
}

/** Equipos que verán «Nota en proceso» si se libera ahora (los de LESS_THAN_MIN_EVALUATIONS sin inProcess son solo aviso). */
export function inProcessTeams(release: FinalGradeRelease): IncompleteFinalGradeTeam[] {
  return release.incompleteTeams.filter((team) => team.inProcess);
}

/** Texto del diálogo de HU-46 A2, o null si no hace falta confirmar. */
export function inProcessConfirmMessage(release: FinalGradeRelease): string | null {
  const count = release.summary.inProcess;
  if (count <= 0) return null;
  const teams = count === 1 ? "Hay 1 equipo con la nota en proceso. Verá" : `Hay ${count} equipos con la nota en proceso. Verán`;
  return `${teams} «Nota en proceso» en lugar de la nota. ¿Liberar de todos modos?`;
}
