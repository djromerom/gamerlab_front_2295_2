import { apiFetch } from "@/lib/api";
import {
  AssignmentWarningsError,
  getAssignmentWarnings,
  type AssignmentWarning,
} from "@/features/jurors/assignment/lib/assignmentWarnings";

/**
 * HU-24 (ARK-217 back / ARK-218 front): alta de un jurado que llegó a la feria sin estar registrado.
 * Queda Junior y Suplente, confirmado en la edición activa, con su llegada manual registrada. Después
 * se le proponen grupos del nivel con más faltantes y se le asignan sumando (nadie pierde grupos).
 * Solo el Administrador (servicio `ManageWalkInJurors`).
 */

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/** Tope de grupos que propone el back (parámetro `maxTeams`, 3 por defecto). */
export const DEFAULT_MAX_TEAMS = 3;
/** El back acepta de 1 a 10 grupos por asignación. */
export const MAX_ASSIGNABLE_TEAMS = 10;

// ─── Tipos (contrato HU-24) ──────────────────────────────────────────────────

export interface CreateWalkInJurorBody {
  firstName: string;
  lastName: string;
  email: string;
  /** true = «no es ninguna de las coincidencias, créalo». No salta el correo repetido. */
  confirmSimilar?: boolean;
}

export interface WalkInJurorCreated {
  juror: { id: string; name: string; email: string; category: "JUNIOR"; type: "BACKUP" };
  edition: { id: number; title: string };
  attendance: { checkedInAt: string; method: "MANUAL" };
  walkIn: true;
}

/** Persona que ya existe (409), sin correo. */
export interface ExistingPerson {
  id: string;
  name: string;
  /** «Jurado», «Profesor», «Estudiante», «Staff»... */
  role: string;
  isActive: boolean;
  /** Es jurado de la edición activa: se le puede marcar la llegada. */
  isJurorOfEdition: boolean;
  editionStatus: "PENDING" | "CONFIRMED" | "DECLINED" | null;
  /** null = todavía no tiene llegada. */
  checkedInAt: string | null;
}

export interface SuggestedTeam {
  id: number;
  codigo: string;
  nombre: string;
  videojuego: string | null;
  /** Asignados (antes de la hora de control) o presentes (después). */
  juradosContados: number;
  /** Cuántos le faltan para llegar a 3. */
  faltantes: number;
}

export type ShortageBasis = "ASSIGNED" | "PRESENT";

export interface TeamSuggestion {
  edition: { id: number; title: string };
  phase: "NOT_CONFIGURED" | "BEFORE_ALERT" | "ALERT" | "CONTROL" | "CLOSED";
  basis: ShortageBasis;
  maxTeams: number;
  level: number | null;
  levelLabel: string | null;
  /** La propuesta: hasta `maxTeams`, todos del mismo nivel. */
  teams: SuggestedTeam[];
  /** Los demás grupos con faltantes del nivel, para «Editar». */
  otherTeamsOfLevel: SuggestedTeam[];
  levels: { level: number; faltantes: number; gruposConFaltantes: number }[];
  reason: null | "NO_SHORTAGE";
}

export interface TeamSummary {
  id: number;
  codigo: string;
  nombre: string;
}

export interface WalkInAssignmentResult {
  message: string;
  edicion: { id: number; title: string };
  jurado: { id: string; nombre: string };
  equiposAgregados: TeamSummary[];
  equiposYaAsignados: TeamSummary[];
  advertenciasAceptadas: AssignmentWarning[];
}

// ─── Errores ─────────────────────────────────────────────────────────────────

/**
 * Error del back con su `code`. En un 400 de validación `messages` trae la lista del back; en los
 * 409 del alta vienen `existing` (correo repetido) o `matches` (nombres parecidos).
 */
export class WalkInJurorError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details: { messages?: string[]; existing?: ExistingPerson; matches?: ExistingPerson[] } = {},
  ) {
    super(message);
    this.name = "WalkInJurorError";
  }
}

export const CREATE_FAILED_MESSAGE = "No se pudo dar de alta al jurado. Se revirtió todo y no se creó ninguna cuenta.";
export const ASSIGN_FAILED_MESSAGE = "No se pudieron asignar los grupos. No cambió ninguna asignación.";
const FORBIDDEN_MESSAGE = "No tienes permiso: solo el administrador da de alta jurados del día.";

const MESSAGE_BY_CODE: Record<string, string> = {
  NO_ACTIVE_EDITION: "No hay una edición activa.",
  NOT_A_JUNIOR_SUBSTITUTE: "Este jurado no es Suplente Junior confirmado de la edición activa.",
  TEAM_NOT_FOUND: "Algún grupo ya no existe o está inactivo. Vuelve a pedir la propuesta.",
};

async function readBody(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const body = await res.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

function messagesOf(body: Record<string, unknown> | null): string[] {
  const message = body?.message;
  if (typeof message === "string" && message) return [message];
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === "string");
  return [];
}

function isPerson(value: unknown): value is ExistingPerson {
  return !!value && typeof value === "object" && typeof (value as ExistingPerson).id === "string";
}

function toError(status: number, body: Record<string, unknown> | null, fallback: string): WalkInJurorError {
  const code = typeof body?.code === "string" ? body.code : undefined;
  const messages = messagesOf(body);
  if (status >= 500) return new WalkInJurorError(fallback, status, code);
  if (status === 403) return new WalkInJurorError(FORBIDDEN_MESSAGE, status, code);
  const message = (code && MESSAGE_BY_CODE[code]) || messages.join(", ") || fallback;
  return new WalkInJurorError(message, status, code, {
    messages,
    existing: isPerson(body?.existing) ? body.existing : undefined,
    matches: Array.isArray(body?.matches) ? body.matches.filter(isPerson) : undefined,
  });
}

const postJson = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ─── Llamadas ────────────────────────────────────────────────────────────────

/**
 * Da de alta al jurado y registra su llegada. Lanza {@link WalkInJurorError}: 409
 * `EMAIL_ALREADY_EXISTS` (con `existing`), 409 `SIMILAR_PEOPLE` (con `matches`; se repite con
 * `confirmSimilar: true`), 400 con los textos por campo. En ningún error se crea nada.
 */
export async function createWalkInJuror(body: CreateWalkInJurorBody): Promise<WalkInJurorCreated> {
  const res = await apiFetch(`${API_URL}/walk-in-jurors`, postJson(body));
  if (res.ok) return res.json();
  throw toError(res.status, await readBody(res), CREATE_FAILED_MESSAGE);
}

/** Propuesta de grupos para un Suplente Junior confirmado. No guarda nada. */
export async function fetchTeamSuggestion(jurorId: string, maxTeams = DEFAULT_MAX_TEAMS): Promise<TeamSuggestion> {
  const res = await apiFetch(
    `${API_URL}/walk-in-jurors/${encodeURIComponent(jurorId)}/team-suggestion?maxTeams=${maxTeams}`,
  );
  if (res.ok) return res.json();
  throw toError(res.status, await readBody(res), "No se pudo calcular la propuesta de grupos.");
}

/**
 * Asigna los grupos sumando. Lanza {@link AssignmentWarningsError} con un 409
 * `ASSIGNMENT_WARNINGS` (se repite con `confirmWarnings: true`) y {@link WalkInJurorError} con
 * cualquier otro error (los bloqueos de HU-08 traen su `code`). En ningún error se guarda nada.
 */
export async function assignWalkInTeams(
  jurorId: string,
  teamIds: number[],
  confirmWarnings = false,
): Promise<WalkInAssignmentResult> {
  const res = await apiFetch(
    `${API_URL}/walk-in-jurors/${encodeURIComponent(jurorId)}/assignments`,
    postJson({ teamIds, confirmWarnings }),
  );
  if (res.ok) return res.json();

  const data = await readBody(res);
  const warnings = getAssignmentWarnings(res.status, data);
  if (warnings) {
    throw new AssignmentWarningsError(messagesOf(data)[0] ?? "La asignación rompe reglas de asignación.", warnings);
  }
  throw toError(res.status, data, ASSIGN_FAILED_MESSAGE);
}

/** Reenvía el correo para crear la cuenta (ruta que ya existe en Personal → Jurados). */
export async function resendJurorAccountEmail(email: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/juror/resend-confirmation`, postJson({ email }));
  if (!res.ok) throw toError(res.status, await readBody(res), "No se pudo reenviar el correo.");
}
