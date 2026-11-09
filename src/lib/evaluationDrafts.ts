import { apiFetch } from "@/lib/api";

/**
 * HU-18 (ARK-105): borradores de evaluación guardados en el servidor (ARK-104).
 * El servidor es la fuente principal; localStorage solo guarda lo que aún no se
 * pudo sincronizar (sin red, error del servidor), para no perderlo.
 */

export type DraftStatus = "PENDING" | "ALREADY_SUBMITTED" | "NOT_ASSIGNED";

export interface ServerDraft {
  videogameId: number;
  videogameName: string;
  teamId: number;
  teamName: string;
  teamCode: string;
  details: { criterionId: number; score: number }[];
  comments: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  status: DraftStatus;
  blockedReason?: string;
}

/** Lo que el jurado lleva escrito, tal como está en el formulario. */
export interface DraftForm {
  scores: Record<number, string>;
  comments: string;
}

export const MAX_DRAFT_COMMENTS = 5000;

const API = () => import.meta.env.VITE_ENDPOINT_BACKEND;

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

export type DraftErrorKind =
  | "network" // sin red o 5xx: reintentar, conservar en local
  | "conflict" // 409 DRAFT_VERSION_CONFLICT
  | "submitted" // 409 EVALUATION_ALREADY_SUBMITTED
  | "forbidden" // 403: el grupo no se puede calificar
  | "invalid" // 400
  | "session" // 401 que el interceptor no pudo recuperar
  | "unknown";

export class DraftRequestError extends Error {
  constructor(
    readonly kind: DraftErrorKind,
    message: string,
    readonly draft: ServerDraft | null = null,
  ) {
    super(message);
  }
}

const FALLBACK_MESSAGES: Record<DraftErrorKind, string> = {
  network: "Sin conexión con el servidor",
  conflict: "El borrador cambió en otra pestaña o dispositivo",
  submitted: "Ya enviaste la evaluación de este grupo",
  forbidden: "Este grupo no se puede calificar",
  invalid: "El borrador tiene datos inválidos",
  session: "Tu sesión venció; vuelve a iniciar sesión",
  unknown: "No se pudo guardar el borrador",
};

async function toDraftError(res: Response): Promise<DraftRequestError> {
  let body: { code?: string; message?: unknown; draft?: ServerDraft | null } = {};
  try {
    body = await res.json();
  } catch {
    /* sin cuerpo JSON */
  }
  const rawMessage = Array.isArray(body.message)
    ? body.message.join(". ")
    : typeof body.message === "string"
      ? body.message
      : "";

  let kind: DraftErrorKind = "unknown";
  if (res.status >= 500) kind = "network";
  else if (res.status === 409 && body.code === "DRAFT_VERSION_CONFLICT") kind = "conflict";
  else if (res.status === 409 && body.code === "EVALUATION_ALREADY_SUBMITTED") kind = "submitted";
  else if (res.status === 403) kind = "forbidden";
  else if (res.status === 400) kind = "invalid";
  else if (res.status === 401) kind = "session";

  return new DraftRequestError(kind, rawMessage || FALLBACK_MESSAGES[kind], body.draft ?? null);
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await apiFetch(`${API()}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    // fetch lanza TypeError sin red; cualquier otra falla de transporte se trata igual
    const message = error instanceof Error ? error.message : "";
    throw new DraftRequestError("network", message || FALLBACK_MESSAGES.network);
  }
  if (!res.ok) throw await toDraftError(res);
  return res;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export interface SaveDraftBody {
  version: number;
  details: { criterionId: number; score: number }[];
  comments: string;
}

export async function fetchDraft(videogameId: number): Promise<ServerDraft | null> {
  const res = await request(`/evaluation/drafts/${videogameId}`);
  const data = (await res.json()) as { draft: ServerDraft | null };
  return data.draft ?? null;
}

export async function fetchDrafts(): Promise<ServerDraft[]> {
  const res = await request(`/evaluation/drafts`);
  const data = await res.json();
  return Array.isArray(data) ? (data as ServerDraft[]) : [];
}

export async function saveDraft(videogameId: number, body: SaveDraftBody): Promise<ServerDraft> {
  const res = await request(`/evaluation/drafts/${videogameId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return (await res.json()) as ServerDraft;
}

export async function discardDraft(videogameId: number): Promise<boolean> {
  const res = await request(`/evaluation/drafts/${videogameId}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  return Boolean((data as { discarded?: boolean }).discarded);
}

// ---------------------------------------------------------------------------
// Conversión formulario <-> servidor
// ---------------------------------------------------------------------------

/** Nota válida para el borrador (0 a 5, 2 decimales) o null si el campo no tiene una nota usable. */
export function toDraftScore(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const text = String(raw).trim().replace(/,/g, ".");
  if (!text) return null;
  const parsed = Number.parseFloat(text);
  if (!Number.isFinite(parsed)) return null;
  const clamped = Math.min(5, Math.max(0, parsed));
  return Math.round(clamped * 100) / 100;
}

export function isEmptyForm(form: DraftForm): boolean {
  return (
    !form.comments.trim() &&
    Object.values(form.scores).every((score) => toDraftScore(score) === null)
  );
}

export function toSaveBody(form: DraftForm, version: number): SaveDraftBody {
  const details: SaveDraftBody["details"] = [];
  for (const [criterionId, raw] of Object.entries(form.scores)) {
    const score = toDraftScore(raw);
    if (score !== null) details.push({ criterionId: Number(criterionId), score });
  }
  return { version, details, comments: form.comments.slice(0, MAX_DRAFT_COMMENTS) };
}

/** Formulario de RatePage/SchoolRate (criterios con su nota escrita) a DraftForm. */
export function formFromCriteria(
  criteria: { id: number; score: string | number }[],
  comments: string,
): DraftForm {
  const scores: Record<number, string> = {};
  for (const criterion of criteria) {
    if (criterion.score !== "" && criterion.score != null) scores[criterion.id] = String(criterion.score);
  }
  return { scores, comments };
}

export function fromServerDraft(draft: ServerDraft): DraftForm {
  const scores: Record<number, string> = {};
  for (const { criterionId, score } of draft.details ?? []) {
    scores[criterionId] = String(score);
  }
  return { scores, comments: draft.comments ?? "" };
}

// ---------------------------------------------------------------------------
// Respaldo local (solo lo que no se pudo sincronizar)
// ---------------------------------------------------------------------------

const BACKUP_PREFIX = "evaluation-draft-";
// Claves de antes de HU-18; se leen una vez para no perder lo que ya estaba escrito.
const LEGACY_PREFIXES = ["rate-draft-", "batch-rate-draft-", "school-rate-draft-"];

export interface LocalBackup extends DraftForm {
  /** Momento en que se escribió en este dispositivo (ms). 0 si viene de una clave antigua. */
  savedAt: number;
}

export const backupKey = (videogameId: number) => `${BACKUP_PREFIX}${videogameId}`;

export function writeBackup(videogameId: number, form: DraftForm): void {
  try {
    localStorage.setItem(
      backupKey(videogameId),
      JSON.stringify({ ...form, savedAt: Date.now() } satisfies LocalBackup),
    );
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

/** Formatos antiguos: RatePage {scores, comments}, BatchRatePage {scores:{comments, details}}, SchoolRate {criteria, comments}. */
function parseLegacy(raw: unknown): DraftForm | null {
  if (!raw || typeof raw !== "object") return null;
  type LegacyScore = { id?: unknown; criterionId?: unknown; score?: unknown };
  const data = raw as {
    criteria?: LegacyScore[];
    comments?: unknown;
    scores?: { details?: LegacyScore[]; comments?: unknown } & Record<string, unknown>;
  };
  const scores: Record<number, string> = {};
  const hasScore = (s: LegacyScore) => s.score !== "" && s.score != null;

  if (Array.isArray(data.criteria)) {
    for (const c of data.criteria) {
      if (c && typeof c.id === "number" && hasScore(c)) scores[c.id] = String(c.score);
    }
    return { scores, comments: typeof data.comments === "string" ? data.comments : "" };
  }
  if (data.scores && Array.isArray(data.scores.details)) {
    for (const d of data.scores.details) {
      if (d && typeof d.criterionId === "number" && hasScore(d)) scores[d.criterionId] = String(d.score);
    }
    return { scores, comments: typeof data.scores.comments === "string" ? data.scores.comments : "" };
  }
  if (data.scores && typeof data.scores === "object") {
    for (const [id, score] of Object.entries(data.scores)) {
      if (score !== "" && score != null) scores[Number(id)] = String(score);
    }
    return { scores, comments: typeof data.comments === "string" ? data.comments : "" };
  }
  return null;
}

export function readBackup(videogameId: number): LocalBackup | null {
  try {
    const saved = localStorage.getItem(backupKey(videogameId));
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<LocalBackup>;
      if (parsed && typeof parsed.scores === "object" && parsed.scores) {
        return {
          scores: parsed.scores as Record<number, string>,
          comments: typeof parsed.comments === "string" ? parsed.comments : "",
          savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
        };
      }
    }
    for (const prefix of LEGACY_PREFIXES) {
      const legacy = localStorage.getItem(`${prefix}${videogameId}`);
      if (!legacy) continue;
      const form = parseLegacy(JSON.parse(legacy));
      if (form && !isEmptyForm(form)) return { ...form, savedAt: 0 };
    }
  } catch {
    /* JSON corrupto o almacenamiento bloqueado */
  }
  return null;
}

export function clearBackup(videogameId: number): void {
  try {
    localStorage.removeItem(backupKey(videogameId));
    for (const prefix of LEGACY_PREFIXES) localStorage.removeItem(`${prefix}${videogameId}`);
  } catch {
    /* ignorar */
  }
}

/** Al cerrar sesión: que los borradores no pasen al siguiente usuario del navegador (BG-08). */
export function clearAllBackups(): void {
  try {
    const prefixes = [BACKUP_PREFIX, ...LEGACY_PREFIXES];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignorar */
  }
}

/** "hace un momento", "hace 5 min", "hace 2 h", "hace 3 días". */
export function formatSavedAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "";
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "hace 1 día" : `hace ${days} días`;
}

// ---------------------------------------------------------------------------
// Qué cargar al abrir el formulario
// ---------------------------------------------------------------------------

export interface InitialDraft {
  form: DraftForm | null;
  version: number;
  /** Hay trabajo local más nuevo que el servidor: hay que subirlo. */
  needsSync: boolean;
  source: "server" | "local" | "none";
}

/**
 * El servidor manda, salvo que en este dispositivo haya algo escrito después del
 * último guardado del servidor (se quedó sin red antes de sincronizar).
 */
export function pickInitialDraft(server: ServerDraft | null, local: LocalBackup | null): InitialDraft {
  const version = server?.version ?? 0;
  if (local && !isEmptyForm(local)) {
    const serverTime = server ? Date.parse(server.updatedAt) : Number.NEGATIVE_INFINITY;
    if (!server || local.savedAt > serverTime) {
      return { form: { scores: local.scores, comments: local.comments }, version, needsSync: true, source: "local" };
    }
  }
  if (server) return { form: fromServerDraft(server), version, needsSync: false, source: "server" };
  return { form: null, version: 0, needsSync: false, source: "none" };
}
