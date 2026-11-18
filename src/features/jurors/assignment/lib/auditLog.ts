import type { AssignmentAuditLog } from "@/features/jurors/types/jurors";

/**
 * ARK-262 (BG-62): historial de cambios manuales de asignación, por páginas.
 * El back admite hasta 100 por página (`limit`) y trae los nombres de cada registro.
 */
export const AUDIT_PAGE_SIZE = 50;

export const auditLogPath = (page: number) =>
  `/juror/assignments/audit?page=${page}&limit=${AUDIT_PAGE_SIZE}`;

export const AUDIT_UNAVAILABLE = {
  actor: "Usuario no disponible",
  juror: "Jurado no disponible",
  team: "Equipo no disponible",
} as const;

export interface AuditPage {
  logs: AssignmentAuditLog[];
  /** Página que devolvió el back (la pedida si no la informa). */
  page: number;
  /** Total de registros del historial; si el back no lo informa, los recibidos. */
  totalItems: number;
}

/** Lee `{ data, metadata }` del back (o un arreglo suelto, por compatibilidad). */
export function parseAuditPage(payload: unknown, requestedPage: number): AuditPage {
  const body = (payload && typeof payload === "object" ? payload : {}) as {
    data?: unknown;
    metadata?: { totalItems?: unknown; currentPage?: unknown };
  };
  const logs = (Array.isArray(payload) ? payload : Array.isArray(body.data) ? body.data : []) as AssignmentAuditLog[];
  const totalItems = Number(body.metadata?.totalItems);
  const currentPage = Number(body.metadata?.currentPage);

  return {
    logs,
    page: Number.isInteger(currentPage) && currentPage > 0 ? currentPage : requestedPage,
    totalItems: Number.isFinite(totalItems) && totalItems >= 0 ? totalItems : logs.length,
  };
}

/** Agrega los registros nuevos al final sin repetir los que ya están (por `id`). */
export function mergeAuditLogs(
  current: AssignmentAuditLog[],
  incoming: AssignmentAuditLog[]
): AssignmentAuditLog[] {
  const seen = new Set(current.map((log) => log.id).filter((id) => id !== undefined && id !== null));
  const added = incoming.filter((log) => {
    if (log.id === undefined || log.id === null) return true;
    if (seen.has(log.id)) return false;
    seen.add(log.id);
    return true;
  });
  return [...current, ...added];
}

/**
 * El nombre de una persona del registro: el que trae el back, si no el de las listas que ya tiene
 * la pantalla y, si no se conoce, «no disponible». Nunca el identificador interno.
 */
export function auditPersonLabel(
  id: string | null | undefined,
  backendName: string | null | undefined,
  localName: string | null,
  unavailable: string
): string {
  if (!id) return "N/A";
  return backendName || localName || unavailable;
}

/** «Equipo (Juego)» con lo que trae el back o, si falta, con las listas de la pantalla. */
export function auditTeamLabel(
  log: Pick<AssignmentAuditLog, "teamId" | "teamName" | "gameName">,
  localLabel: string | null
): string {
  if (log.teamId === undefined || log.teamId === null) return "N/A";
  if (log.teamName) return log.gameName ? `${log.teamName} (${log.gameName})` : log.teamName;
  return localLabel || AUDIT_UNAVAILABLE.team;
}

/** La nota con los códigos de advertencia ya traducidos por el back; la guardada si no vino. */
export function auditNoteText(log: Pick<AssignmentAuditLog, "notes" | "notesText">): string | null {
  const text = log.notesText ?? log.notes;
  return text ? String(text) : null;
}
