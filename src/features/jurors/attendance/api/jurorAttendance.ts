import { apiFetch } from "@/lib/api";
import { compareInstantsDesc, formatBogotaDateTime } from "@/lib/bogotaDateTime";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

// ─── Tipos (contrato HU-29, docs/frontend/HU-29-asistencia-jurados.md del back) ──

export type AttendanceStatus = "PRESENT" | "MISSING";
export type AttendanceMethod = "QR" | "MANUAL";
export type AttendanceCategory = "Senior" | "Junior" | "Sin categoría";

export interface JurorAttendanceItem {
  jurorId: string;
  name: string;
  category: AttendanceCategory;
  isProfessor: boolean;
  hasBadge: boolean;
  status: AttendanceStatus;
  /** ISO en UTC; null si falta. */
  checkedInAt: string | null;
  method: AttendanceMethod | null;
  checkedInBy: { id: string; name: string } | null;
}

export interface JurorAttendanceResult {
  edition: { id: number; title: string };
  /** Respetan la búsqueda pero no el estado: las pestañas no cambian al pasar de una a otra. */
  totals: { present: number; missing: number; total: number };
  data: JurorAttendanceItem[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export interface JurorAttendanceQuery {
  status?: AttendanceStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const ATTENDANCE_PAGE_SIZE = 50;
export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 50;
/** Se actualiza sola cada 10 s, como el panel de seguimiento (HU-21). */
export const ATTENDANCE_POLL_MS = 10_000;

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  MISSING: "Falta",
};

export const METHOD_LABEL: Record<AttendanceMethod, string> = {
  QR: "QR",
  MANUAL: "Manual",
};

/** Error con el código HTTP: la página distingue "sin feria activa" (404) y "sin permiso" (403). */
export class JurorAttendanceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const FIXED_MESSAGES: Record<number, string> = {
  403: "No tienes permiso para ver la asistencia de los jurados.",
  404: "No hay una feria activa.",
};

async function toError(res: Response): Promise<JurorAttendanceError> {
  const fixed = FIXED_MESSAGES[res.status];
  if (fixed) return new JurorAttendanceError(fixed, res.status);
  try {
    const body = await res.json();
    if (typeof body?.message === "string") return new JurorAttendanceError(body.message, res.status);
    if (Array.isArray(body?.message)) return new JurorAttendanceError(body.message.join(", "), res.status);
  } catch {
    // no es JSON
  }
  return new JurorAttendanceError("No se pudo cargar la asistencia de los jurados.", res.status);
}

/** Solo manda la búsqueda con 2 a 50 caracteres, que es lo que acepta el back. */
export function attendanceQueryString(query: JurorAttendanceQuery = {}): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  const search = query.search?.trim();
  if (search && search.length >= SEARCH_MIN_LENGTH) params.set("search", search.slice(0, SEARCH_MAX_LENGTH));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  params.set("limit", String(query.limit ?? ATTENDANCE_PAGE_SIZE));
  return params.toString();
}

export async function fetchJurorAttendance(query: JurorAttendanceQuery = {}): Promise<JurorAttendanceResult> {
  const res = await apiFetch(`${API_URL}/juror-attendance?${attendanceQueryString(query)}`);
  if (!res.ok) throw await toError(res);
  return res.json();
}

/**
 * Llegada en hora de Colombia (el back la manda en UTC): solo la hora si es de hoy,
 * «11/11, 12:17 a. m.» si es de otro día (ARK-261).
 */
export function formatArrival(iso: string | null, now: string | Date = new Date()): string {
  return formatBogotaDateTime(iso, now);
}

/**
 * Orden de la tabla (ARK-261): primero los que faltan y luego los presentes, el último en
 * llegar arriba, por fecha y hora completas. Es el mismo orden del back; al ser estable,
 * los empates conservan el orden por apellido que manda el back.
 */
export function sortAttendanceRows(rows: JurorAttendanceItem[]): JurorAttendanceItem[] {
  return [...rows].sort((a, b) => {
    const aPresent = a.checkedInAt !== null;
    const bPresent = b.checkedInAt !== null;
    if (aPresent !== bPresent) return aPresent ? 1 : -1;
    return compareInstantsDesc(a.checkedInAt, b.checkedInAt);
  });
}
