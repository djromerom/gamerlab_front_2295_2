import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

// ─── Tipos (contrato HU-23, docs/frontend/HU-23-presencia-jurado.md del back) ──

export interface PresenceSettings {
  /** Cada cuánto se pregunta "¿Sigues en la feria?". */
  promptEveryMinutes: number;
  /** Minutos para responder antes de quedar "presencia sin confirmar". */
  responseWindowMinutes: number;
  /** Minutos sin enviar evaluaciones para "posible salida". */
  inactivityMinutes: number;
}

export interface PresenceEdition {
  id: number;
  title: string;
}

export interface MyPresence {
  edition: PresenceEdition;
  /** Hora del servidor al responder (ISO UTC). */
  serverTime: string;
  evaluationsOpen: boolean;
  settings: PresenceSettings;
  /** false: sin llegada registrada, nunca se pregunta. */
  checkedIn: boolean;
  checkedInAt: string | null;
  /** Último "Sigo aquí". */
  lastConfirmedAt: string | null;
  nextPromptAt: string | null;
  /** true: mostrar "¿Sigues en la feria?" ya. */
  promptDue: boolean;
}

export type PresenceIndicator = "PRESENCE_UNCONFIRMED" | "POSSIBLE_LEFT";
export type PresenceFilter = PresenceIndicator | "ANY";
export type PresenceCategory = "Senior" | "Junior" | "Sin categoría";

export interface JurorPresenceItem {
  jurorId: string;
  name: string;
  category: PresenceCategory;
  isProfessor: boolean;
  checkedInAt: string;
  lastConfirmedAt: string | null;
  /** Última evaluación enviada desde su llegada. */
  lastActivityAt: string | null;
  nextPromptAt: string;
  /** [] = sin alertas. */
  indicators: PresenceIndicator[];
}

export interface JurorPresenceList {
  edition: PresenceEdition;
  serverTime: string;
  evaluationsOpen: boolean;
  settings: PresenceSettings;
  /** No cambian con el filtro. */
  totals: {
    checkedIn: number;
    presenceUnconfirmed: number;
    possibleLeft: number;
    withAnyIndicator: number;
  };
  data: JurorPresenceItem[];
}

export interface PresenceSettingsResult {
  edition: PresenceEdition;
  settings: PresenceSettings;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** La pantalla del jurado consulta cada minuto, como pide el contrato. */
export const MY_PRESENCE_POLL_MS = 60_000;
/** Mientras "Sigo aquí" no llega al servidor (sin conexión o 5xx), se reintenta con esta pausa. */
export const CONFIRM_RETRY_MS = 15_000;
/** El panel del administrador se actualiza cada 10 s, como el resto del seguimiento. */
export const PRESENCE_LIST_POLL_MS = 10_000;

export const INDICATOR_LABEL: Record<PresenceIndicator, string> = {
  PRESENCE_UNCONFIRMED: "Presencia sin confirmar",
  POSSIBLE_LEFT: "Posible salida",
};

export const PRESENCE_HELP =
  "Mantén la plataforma abierta durante la feria: cada hora te preguntaremos si sigues aquí.";

export const SETTINGS_RANGES: Record<keyof PresenceSettings, { min: number; max: number; label: string }> = {
  promptEveryMinutes: { min: 10, max: 240, label: "Preguntar cada" },
  responseWindowMinutes: { min: 1, max: 120, label: "Tiempo para responder" },
  inactivityMinutes: { min: 10, max: 240, label: "Sin evaluar para «Posible salida»" },
};

// ─── Errores ─────────────────────────────────────────────────────────────────

/** Error con el código HTTP y el `code` del back (por ejemplo JUROR_NOT_CHECKED_IN). */
export class JurorPresenceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

const FIXED_MESSAGES: Record<number, string> = {
  403: "No tienes permiso para ver la presencia de los jurados.",
};

async function toError(res: Response, fallback: string): Promise<JurorPresenceError> {
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
  return new JurorPresenceError(FIXED_MESSAGES[res.status] ?? message ?? fallback, res.status, code);
}

/**
 * "Sigo aquí" no llegó por la conexión o por un fallo del servidor: la ventana se queda en
 * pantalla y se reintenta (CU-23, excepciones). Un 4xx es una respuesta definitiva.
 */
export function isRetryableConfirmError(error: unknown): boolean {
  if (error instanceof JurorPresenceError) return error.status >= 500;
  return true;
}

// ─── Llamadas ────────────────────────────────────────────────────────────────

export async function fetchMyPresence(): Promise<MyPresence> {
  const res = await apiFetch(`${API_URL}/juror-presence/me`);
  if (!res.ok) throw await toError(res, "No se pudo consultar tu presencia en la feria.");
  return res.json();
}

export async function confirmMyPresence(): Promise<MyPresence> {
  const res = await apiFetch(`${API_URL}/juror-presence/me/confirm`, { method: "POST" });
  if (!res.ok) throw await toError(res, "No se pudo confirmar que sigues en la feria.");
  return res.json();
}

export async function fetchJurorPresence(indicator?: PresenceFilter): Promise<JurorPresenceList> {
  const query = indicator ? `?indicator=${indicator}` : "";
  const res = await apiFetch(`${API_URL}/juror-presence${query}`);
  if (!res.ok) throw await toError(res, "No se pudo cargar la presencia de los jurados.");
  return res.json();
}

export async function fetchPresenceSettings(): Promise<PresenceSettingsResult> {
  const res = await apiFetch(`${API_URL}/juror-presence/settings`);
  if (!res.ok) throw await toError(res, "No se pudieron cargar los parámetros de presencia.");
  return res.json();
}

/** Solo se envían los campos que cambian; el back conserva los demás. */
export async function updatePresenceSettings(changes: Partial<PresenceSettings>): Promise<PresenceSettingsResult> {
  const res = await apiFetch(`${API_URL}/juror-presence/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw await toError(res, "No se pudieron guardar los parámetros de presencia.");
  return res.json();
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Milisegundos hasta la próxima pregunta según el reloj del servidor (`nextPromptAt - serverTime`),
 * no el del celular. null si no hay próxima pregunta.
 */
export function msUntilNextPrompt(presence: Pick<MyPresence, "serverTime" | "nextPromptAt">): number | null {
  if (!presence.nextPromptAt) return null;
  const diff = Date.parse(presence.nextPromptAt) - Date.parse(presence.serverTime);
  return Number.isFinite(diff) ? diff : null;
}

/**
 * Cuándo volver a consultar: cada minuto, o antes si la próxima pregunta llega primero
 * (con un segundo de margen para que el back ya la marque como pendiente).
 */
export function nextCheckDelay(presence: MyPresence | null): number {
  if (!presence || presence.promptDue) return MY_PRESENCE_POLL_MS;
  const until = msUntilNextPrompt(presence);
  if (until === null || until < 0) return MY_PRESENCE_POLL_MS;
  return Math.min(MY_PRESENCE_POLL_MS, until + 1_000);
}

/** Hora en Colombia (el back la manda en UTC). */
export function formatBogotaTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

/** "cada hora", "cada 2 horas", "cada 30 minutos". */
export function describeInterval(minutes: number): string {
  if (minutes === 60) return "cada hora";
  if (minutes % 60 === 0) return `cada ${minutes / 60} horas`;
  return `cada ${minutes} minutos`;
}

/** Texto de ayuda con el intervalo real de la edición. */
export function presenceHelp(settings?: PresenceSettings): string {
  if (!settings) return PRESENCE_HELP;
  return `Mantén la plataforma abierta durante la feria: ${describeInterval(settings.promptEveryMinutes)} te preguntaremos si sigues aquí.`;
}

/** Valida en el front los rangos del back; devuelve los mensajes de error (vacío si todo está bien). */
export function validatePresenceSettings(settings: PresenceSettings): string[] {
  return (Object.keys(SETTINGS_RANGES) as (keyof PresenceSettings)[]).flatMap((field) => {
    const { min, max, label } = SETTINGS_RANGES[field];
    const value = settings[field];
    if (!Number.isInteger(value) || value < min || value > max) {
      return [`${label}: un número entero entre ${min} y ${max} minutos.`];
    }
    return [];
  });
}

/** Solo los campos que cambiaron, para el PATCH. */
export function changedSettings(original: PresenceSettings, edited: PresenceSettings): Partial<PresenceSettings> {
  return (Object.keys(edited) as (keyof PresenceSettings)[]).reduce<Partial<PresenceSettings>>((changes, field) => {
    if (edited[field] !== original[field]) changes[field] = edited[field];
    return changes;
  }, {});
}
