import { apiFetch } from '@/lib/api';

/**
 * HU-07 (ARK-114 back / ARK-115 front): asignación automática de jurados en dos pasos.
 * - `preview` calcula la distribución y las alertas sin guardar nada.
 * - `confirm` recalcula y guarda; si el plan cambió responde 409 `AUTO_ASSIGNMENT_OUTDATED`.
 * Reemplaza a la ruta vieja `GET /juror/evaluations-assignment` (calculaba y guardaba en un paso).
 */

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';
const BASE = `${API_URL}/juror/automatic-assignment`;

export const AUTO_ASSIGNMENT_OUTDATED = 'AUTO_ASSIGNMENT_OUTDATED';
export const DEFAULT_MAX_TEAMS_PER_JUROR = 3;
/** Tope que acepta el backend en `maxTeamsPerJuror` (`@Max(20)` en el DTO). */
export const MAX_TEAMS_PER_JUROR_LIMIT = 20;

export type EvaluatorKind = 'PROFESSOR' | 'JUROR' | 'OTHER';
export type AutoJurorCategory = 'JUNIOR' | 'SENIOR' | null;

export type AutoAssignmentAlertCode =
  | 'TEAM_INCOMPLETE'
  | 'TEAM_WITHOUT_SENIOR'
  | 'SCHOOL_WITHOUT_SENIOR_JURORS'
  | 'UNREADABLE_TEAM_LEVEL'
  | 'JUROR_MISSING_CATEGORY'
  | 'JUROR_FIXED_MIXED_LEVELS';

export interface AutoAssignmentEdition {
  id: number;
  title: string;
  status: string;
  writable: boolean;
}

export interface PlannedAssignment {
  teamId: number;
  jurorId: string;
}

export interface AutoAssignmentSummary {
  teams: number;
  completeTeams: number;
  incompleteTeams: number;
  teamsWithoutSenior: number;
  newAssignments: number;
  availableJurors: number;
  jurorsWithNewTeams: number;
}

export interface LevelCoverage {
  level: number;
  label: string;
  teams: number;
  completeTeams: number;
  missingSlots: number;
  teamsWithoutSenior: number;
  jurors: number;
}

export interface PlannedTeamJuror {
  id: string;
  name: string;
  kind: EvaluatorKind;
  jurorCategory: AutoJurorCategory;
  /** true = ya estaba asignado (no se toca); false = lo agrega la automática. */
  fixed: boolean;
}

export interface PlannedTeam {
  id: number;
  teamCode: string;
  teamName: string;
  level: number | null;
  jurors: PlannedTeamJuror[];
  complete: boolean;
  hasSenior: boolean;
}

export interface PlannedJuror {
  id: string;
  name: string;
  kind: EvaluatorKind;
  jurorCategory: AutoJurorCategory;
  level: number | null;
  teamsBefore: number;
  teamsAfter: number;
}

export interface AutoAssignmentAlert {
  code: AutoAssignmentAlertCode | string;
  message: string;
  teamId?: number;
  jurorId?: string;
  level?: number;
}

export interface AutoAssignmentPreview {
  edition: AutoAssignmentEdition;
  backupJurorsExcluded: number;
  limits: { maxTeamsPerJuror: number; jurorsPerTeam: number };
  assignments: PlannedAssignment[];
  summary: AutoAssignmentSummary;
  levels: LevelCoverage[];
  teams: PlannedTeam[];
  jurors: PlannedJuror[];
  alerts: AutoAssignmentAlert[];
}

export interface AutoAssignmentConfirmResult {
  message: string;
  edition: AutoAssignmentEdition;
  saved: number;
  teamsUpdated: number;
  summary: AutoAssignmentSummary;
  alerts: AutoAssignmentAlert[];
}

/** Error de la API con el `status` HTTP y el `code` del cuerpo (si viene). */
export class AutomaticAssignmentError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AutomaticAssignmentError';
    this.status = status;
    this.code = code;
  }
}

/** true si `confirm` respondió que el plan cambió desde la vista previa (409). */
export function isPlanOutdated(error: unknown): boolean {
  return (
    error instanceof AutomaticAssignmentError &&
    (error.code === AUTO_ASSIGNMENT_OUTDATED || (error.status === 409 && !error.code))
  );
}

async function post<T>(path: string, body: unknown, fallbackError: string): Promise<T> {
  const response = await apiFetch(`${BASE}/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const data = (parsed ?? {}) as { message?: unknown; code?: unknown };
    // class-validator devuelve `message` como arreglo: se muestra el primero
    const rawMessage = Array.isArray(data.message) ? data.message[0] : data.message;
    const message =
      typeof rawMessage === 'string' && rawMessage.trim() ? rawMessage : fallbackError;
    const code = typeof data.code === 'string' ? data.code : undefined;
    throw new AutomaticAssignmentError(message, response.status, code);
  }

  return parsed as T;
}

/** Solo se envía `maxTeamsPerJuror` si la pantalla lo cambió (si no, el back usa 3). */
function limitsBody(maxTeamsPerJuror?: number) {
  return maxTeamsPerJuror === undefined ? {} : { maxTeamsPerJuror };
}

/** `POST /juror/automatic-assignment/preview`: calcula el plan. No guarda nada. */
export function previewAutomaticAssignment(
  maxTeamsPerJuror?: number,
): Promise<AutoAssignmentPreview> {
  return post<AutoAssignmentPreview>(
    'preview',
    limitsBody(maxTeamsPerJuror),
    'No se pudo generar la vista previa de la asignación automática.',
  );
}

/**
 * `POST /juror/automatic-assignment/confirm`: guarda el plan. `assignments` debe ser
 * el mismo arreglo de la vista previa y `maxTeamsPerJuror` el mismo valor que se usó en ella.
 */
export function confirmAutomaticAssignment(
  assignments: PlannedAssignment[],
  maxTeamsPerJuror?: number,
): Promise<AutoAssignmentConfirmResult> {
  return post<AutoAssignmentConfirmResult>(
    'confirm',
    { ...limitsBody(maxTeamsPerJuror), assignments },
    'No se pudo guardar la asignación automática.',
  );
}
