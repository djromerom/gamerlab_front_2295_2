import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

// ─── Tipos (contrato HU-22 del back, ARK-84) ─────────────────────────────────

export interface SubstituteNoticeTeam {
  /** null si el equipo se eliminó después (el resto se conserva). */
  teamId: number | null;
  teamCode: string;
  teamName: string;
  videogameName: string | null;
  /** 0 = colegios; null si el código no trae nivel. */
  level: number | null;
  /** "Nivel 1", "Colegios" o "Sin nivel". */
  levelLabel: string;
}

export interface SubstituteNotice {
  id: number;
  /** Cuándo se asignaron los grupos (ISO UTC). */
  createdAt: string;
  /** null = sin leer. */
  readAt: string | null;
  message: string;
  /** Por nivel y luego por código. */
  teams: SubstituteNoticeTeam[];
}

export interface MySubstituteNotices {
  edition: { id: number; title: string };
  serverTime: string;
  /** Sin leer en la edición activa (no cambia con `status`). */
  unreadCount: number;
  /**
   * Propuesta para el back (aún no está en el contrato): true si el jurado es suplente en la
   * edición activa. Sin este campo, el front solo sabe que es suplente cuando recibe un aviso.
   */
  isSubstitute?: boolean;
  /** Primero los sin leer, luego el más reciente. */
  data: SubstituteNotice[];
}

export type NoticeStatusFilter = "unread" | "all";

export type NoticeEmailStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export interface UnreadSubstituteNoticeItem {
  noticeId: number;
  jurorId: string;
  name: string;
  createdAt: string;
  teamCount: number;
  /** SKIPPED = sin claves de correo (solo en desarrollo). */
  emailStatus: NoticeEmailStatus;
}

export interface UnreadSubstituteNotices {
  edition: { id: number; title: string };
  serverTime: string;
  totals: { unread: number; jurors: number };
  /** El más antiguo primero. */
  data: UnreadSubstituteNoticeItem[];
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** El suplente y el panel de seguimiento consultan cada 10 s, como pide el contrato. */
export const SUBSTITUTE_NOTICES_POLL_MS = 10_000;

export const SUBSTITUTE_NOTICE_NOT_FOUND = "SUBSTITUTE_NOTICE_NOT_FOUND";
/** BG-74: el aviso ya no está en FAILED (doble clic u otro administrador lo reenvió primero). */
export const SUBSTITUTE_NOTICE_EMAIL_NOT_FAILED = "SUBSTITUTE_NOTICE_EMAIL_NOT_FAILED";

export const EMAIL_STATUS_LABEL: Record<NoticeEmailStatus, string> = {
  PENDING: "Enviando correo",
  SENT: "Correo enviado",
  FAILED: "El correo no salió",
  SKIPPED: "Correo no configurado",
};

// ─── Errores ─────────────────────────────────────────────────────────────────

/** Error con el código HTTP y el `code` del back (por ejemplo SUBSTITUTE_NOTICE_NOT_FOUND). */
export class SubstituteNoticeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function toError(
  res: Response,
  fallback: string,
  forbidden = "No tienes permiso para ver los avisos de suplentes.",
): Promise<SubstituteNoticeError> {
  let message: string | undefined;
  let code: string | undefined;
  try {
    const body = await res.json();
    if (typeof body?.code === "string") code = body.code;
    if (typeof body?.message === "string") message = body.message;
    else if (Array.isArray(body?.message)) message = body.message.join(", ");
  } catch {
    // no es JSON
  }
  if (res.status === 404 && code === "NO_ACTIVE_EDITION") message = "No hay una feria activa.";
  if (res.status === 403) message = forbidden;
  return new SubstituteNoticeError(message ?? fallback, res.status, code);
}

/** Sin conexión o 5xx: se deja el aviso en pantalla y se reintenta. Un 4xx es definitivo. */
export function isRetryableNoticeError(error: unknown): boolean {
  if (error instanceof SubstituteNoticeError) return error.status >= 500;
  return true;
}

// ─── Llamadas ────────────────────────────────────────────────────────────────

/** Avisos del jurado en la edición activa. Un jurado oficial recibe `data: []`. */
export async function fetchMySubstituteNotices(status: NoticeStatusFilter = "unread"): Promise<MySubstituteNotices> {
  const res = await apiFetch(`${API_URL}/substitute-notices/me?status=${status}`);
  if (!res.ok) throw await toError(res, "No se pudieron consultar tus avisos.");
  return res.json();
}

/** Marca el aviso como leído. Repetirlo no cambia la hora. */
export async function markSubstituteNoticeRead(id: number): Promise<SubstituteNotice> {
  const res = await apiFetch(`${API_URL}/substitute-notices/${id}/read`, { method: "PATCH" });
  if (!res.ok) throw await toError(res, "No se pudo marcar el aviso como leído.");
  return res.json();
}

/** Panel de seguimiento (Administrador): suplentes con el aviso sin leer. */
export async function fetchUnreadSubstituteNotices(): Promise<UnreadSubstituteNotices> {
  const res = await apiFetch(`${API_URL}/substitute-notices/unread`);
  if (!res.ok) throw await toError(res, "No se pudieron cargar los avisos sin leer de los suplentes.");
  return res.json();
}

export interface ResentSubstituteNotice {
  noticeId: number;
  /** PENDING: el correo quedó en cola; cambia a SENT o FAILED en /unread en unos segundos. */
  emailStatus: NoticeEmailStatus;
}

/**
 * BG-74 (ARK-289/290): vuelve a enviar el correo de un aviso cuyo envío falló (Administrador).
 * 202 = en cola. 409 SUBSTITUTE_NOTICE_EMAIL_NOT_FAILED si ya no está en FAILED; 404 si no existe.
 */
export async function resendSubstituteNoticeEmail(id: number): Promise<ResentSubstituteNotice> {
  const res = await apiFetch(`${API_URL}/substitute-notices/${id}/resend`, { method: "POST" });
  if (!res.ok) {
    throw await toError(res, "No se pudo reenviar el correo.", "No tienes permiso para reenviar el correo.");
  }
  return res.json();
}
