import type { RankingDecision, TieGroup } from "@/features/results/api/ranking";

/**
 * HU-47 (ARK-305, back ARK-304): todo empate del ranking se resuelve por fecha de inscripción
 * (primero el grupo inscrito antes; con la misma fecha, el id menor). /tiebreaker solo lo muestra.
 */
export const RESOLVED_BY_REGISTRATION = "Resuelto por fecha de inscripción";

export type TieTeam = TieGroup["teams"][number];

/** Equipos del empate en el orden resuelto por el back (`order`); los que no estén en `order` van al final. */
export function orderedTieTeams(tie: Pick<TieGroup, "teams" | "order">): TieTeam[] {
  const rank = new Map(tie.order.map((teamId, index) => [teamId, index]));
  return [...tie.teams].sort(
    (a, b) => (rank.get(a.teamId) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.teamId) ?? Number.MAX_SAFE_INTEGER),
  );
}

/** «03/10/2026, 10:00 a. m.» en hora de Bogotá, o null si el equipo no tiene fecha de inscripción. */
export function formatRegistrationDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(date);
}

/**
 * Motivo del empate sin el detalle «Orden: …», que trae las fechas en ISO y ya se muestra en la lista.
 * Si el back cambia el texto, se muestra completo.
 */
export function tieReason(explanation: string): string {
  const index = explanation.indexOf(" Orden:");
  return index > 0 ? explanation.slice(0, index) : explanation;
}

/** «puestos 2 y 3» o «puesto 2» */
export function tiePositions(positions: [number, number]): string {
  const [from, to] = positions;
  if (from === to) return `puesto ${from}`;
  return to - from === 1 ? `puestos ${from} y ${to}` : `puestos ${from} a ${to}`;
}

const methodLabels: Record<RankingDecision["method"], string> = {
  PROFESSOR: "Profesor",
  ADMIN: "Administrador",
  REGISTRATION: "Fecha de inscripción",
};

/** Quién tomó una decisión del historial (antes de HU-47). */
export function decisionMethodLabel(method: RankingDecision["method"]): string {
  return methodLabels[method] ?? method;
}
