import { apiFetch } from "@/lib/api";
import {
  AssignmentWarningsError,
  getAssignmentWarnings,
  type AssignmentWarning,
} from "@/features/jurors/assignment/lib/assignmentWarnings";
import type { FairPhase, FairSchedule } from "@/features/jurors/presence/api/absenceAlert";

/**
 * HU-14 (ARK-213 back / ARK-214 front): contingencia con suplentes. A la hora de control el
 * sistema sugiere qué suplentes cubren los grupos de los jurados que no llegaron (o se retiraron);
 * el administrador acepta, rechaza o elige a otro. Aceptar solo suma: nadie pierde grupos.
 */

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";
const BASE = `${API_URL}/juror/contingency`;

export const MIN_EVALUATIONS_LIMITS = { min: 1, max: 10 } as const;
export const MAX_REJECT_REASON = 500;

// ─── Tipos (contrato ARK-213) ────────────────────────────────────────────────

/** Antes de la hora de control cuentan los asignados; desde ella, los presentes. */
export type ContingencyBasis = "ASSIGNED" | "PRESENT";
export type GroupJurorStatus = "PRESENT" | "ABSENT" | "LEFT";
export type JurorCategoryCode = "JUNIOR" | "SENIOR";

export interface ContingencyContext {
  edicion: { id: number; title: string };
  fase: FairPhase;
  base: ContingencyBasis;
  minimoEvaluaciones: number;
  generadoEn: string;
}

export interface GroupJuror {
  id: string;
  nombre: string;
  categoria: JurorCategoryCode | null;
  estado: GroupJurorStatus;
  evaluo: boolean;
  cuenta: boolean;
}

export interface GroupAtRisk {
  teamId: number;
  codigo: string;
  nombre: string;
  videojuego: string | null;
  /** 0 = colegios; null si el código no tiene nivel. */
  nivel: number | null;
  juradosContados: number;
  faltantes: number;
  jurados: GroupJuror[];
}

export interface RankedSubstitute {
  id: string;
  nombre: string;
  categoria: JurorCategoryCode | null;
  /** Grupos que tendría si se acepta todo lo sugerido. */
  carga: number;
  llegada: boolean;
  mismoNivel: boolean;
  mismaCategoria: boolean;
  /** El administrador ya lo rechazó para este grupo. */
  rechazado: boolean;
}

export interface GroupSuggestion extends GroupAtRisk {
  sugeridos: RankedSubstitute[];
  alternativas: RankedSubstitute[];
  sinCubrir: number;
  /** Advertencias de HU-08 si se aceptan los sugeridos de este grupo. */
  advertencias: AssignmentWarning[];
}

export interface SuggestionsResult extends ContingencyContext {
  totales: { gruposEnRiesgo: number; faltantes: number; sugeridos: number; sinCubrir: number };
  suplentesDisponibles: number;
  grupos: GroupSuggestion[];
}

export interface SubstitutePair {
  teamId: number;
  substituteId: string;
}

export interface TeamRef {
  id: number;
  codigo: string;
  nombre: string;
}

export interface AcceptSuggestionsResult {
  message: string;
  suplentes: Array<{ id: string; nombre: string; equiposAgregados: TeamRef[]; equiposYaAsignados: TeamRef[] }>;
  totales: { asignacionesAgregadas: number; asignacionesOmitidas: number };
  advertenciasAceptadas: AssignmentWarning[];
}

export interface RejectSuggestionBody {
  teamId: number;
  substituteIds?: string[];
  reason?: string;
}

export interface RejectSuggestionResult {
  message: string;
  equipo: TeamRef;
  suplentesRechazados: Array<{ id: string; nombre: string }>;
  motivo: string | null;
  rechazadoEn: string;
}

export interface ContingencySettings {
  edicion: { id: number; title: string };
  minEvaluationsPerTeam: number;
  cronograma: Partial<FairSchedule> | null;
}

// ─── Errores ─────────────────────────────────────────────────────────────────

/** Error del back que no se puede saltar (400, 403, 404, 500), con su `code` si viene. */
export class ContingencyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    /** Los bloqueos de HU-08 dicen qué suplente y qué grupo los causan. */
    readonly jurorId?: string,
    readonly teamId?: number,
  ) {
    super(message);
    this.name = "ContingencyError";
  }
}

const MESSAGE_BY_CODE: Record<string, string> = {
  NOT_A_SUBSTITUTE:
    "Ese suplente ya no es Suplente confirmado de la edición. Actualiza la vista o márcalo como Suplente en Jurados de la edición.",
  TEAM_NOT_FOUND: "El grupo ya no existe o está inactivo. Actualiza la vista.",
  NO_SUGGESTION_TO_REJECT: "Este grupo ya no tiene una sugerencia que rechazar. Actualiza la vista.",
  EVENT_CONFIGURATION_NOT_FOUND:
    "La edición activa no tiene configuración del evento. Actívala de nuevo desde Ediciones para crearla.",
  NO_ACTIVE_EDITION: "No hay una edición activa.",
};

async function readBody(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const body = await res.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

function backMessage(body: Record<string, unknown> | null): string | undefined {
  const message = body?.message;
  if (typeof message === "string" && message) return message;
  if (Array.isArray(message)) return message.join(", ");
  return undefined;
}

async function toError(res: Response, fallback: string): Promise<Error> {
  const body = await readBody(res);
  const warnings = getAssignmentWarnings(res.status, body);
  if (warnings) return new AssignmentWarningsError(backMessage(body) ?? "La asignación rompe reglas de asignación.", warnings);

  const code = typeof body?.code === "string" ? body.code : undefined;
  if (res.status >= 500) return new ContingencyError(fallback, res.status, code);
  if (res.status === 403) return new ContingencyError("Solo el administrador puede gestionar la contingencia con suplentes.", res.status, code);
  if (res.status === 404 && !code) return new ContingencyError(backMessage(body) ?? "No hay una edición activa.", res.status);
  const message = (code && MESSAGE_BY_CODE[code]) || backMessage(body) || fallback;
  const jurorId = typeof body?.jurorId === "string" ? body.jurorId : undefined;
  const teamId = typeof body?.teamId === "number" ? body.teamId : undefined;
  return new ContingencyError(message, res.status, code, jurorId, teamId);
}

async function get<T>(path: string, fallback: string): Promise<T> {
  const res = await apiFetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) throw await toError(res, fallback);
  return res.json();
}

async function send<T>(method: "POST" | "PUT", path: string, body: unknown, fallback: string): Promise<T> {
  const res = await apiFetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res, fallback);
  return res.json();
}

// ─── Llamadas ────────────────────────────────────────────────────────────────

/** Grupos en riesgo con la sugerencia de suplentes. No guarda nada. */
export function fetchContingencySuggestions(): Promise<SuggestionsResult> {
  return get("/suggestions", "No se pudo cargar la sugerencia de suplentes.");
}

/**
 * Guarda los pares grupo-suplente (un grupo, todos o uno elegido a mano). Lanza
 * {@link AssignmentWarningsError} con un 409 `ASSIGNMENT_WARNINGS` (se repite con
 * `confirmWarnings: true`) y {@link ContingencyError} con cualquier otro error.
 */
export function acceptSubstituteSuggestions(
  assignments: SubstitutePair[],
  confirmWarnings = false,
): Promise<AcceptSuggestionsResult> {
  return send(
    "POST",
    "/suggestions/accept",
    { assignments, confirmWarnings },
    "No se pudo asignar a los suplentes. No cambió ninguna asignación.",
  );
}

/** Rechaza la sugerencia de un grupo (toda, o solo algunos suplentes). No cambia asignaciones. */
export function rejectSubstituteSuggestion(body: RejectSuggestionBody): Promise<RejectSuggestionResult> {
  const reason = body.reason?.trim();
  return send(
    "POST",
    "/suggestions/reject",
    {
      teamId: body.teamId,
      ...(body.substituteIds?.length ? { substituteIds: body.substituteIds } : {}),
      ...(reason ? { reason } : {}),
    },
    "No se pudo rechazar la sugerencia.",
  );
}

export function fetchContingencySettings(): Promise<ContingencySettings> {
  return get("/settings", "No se pudieron cargar los parámetros de la contingencia.");
}

export function updateContingencySettings(minEvaluationsPerTeam: number): Promise<ContingencySettings> {
  return send("PUT", "/settings", { minEvaluationsPerTeam }, "No se pudo guardar el mínimo de evaluaciones.");
}
