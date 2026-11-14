import { apiFetch } from "@/lib/api";
import { fetchAllPages } from "@/lib/pagination";
import {
  AssignmentWarningsError,
  getAssignmentWarnings,
  type AssignmentWarning,
} from "@/features/jurors/assignment/lib/assignmentWarnings";

/**
 * HU-09 (ARK-215 back / ARK-216 front): suplentes en lote. Cada suplente elegido queda asignado a
 * todos los grupos que tienen hoy los jurados elegidos en la edición activa. Se suma, no se quita;
 * todo o nada; las reglas de HU-08 se aplican a todos los pares nuevos a la vez.
 */

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export const MAX_COVERED_JURORS = 20;
export const MAX_SUBSTITUTES = 10;

// ─── Tipos (contrato ARK-215) ────────────────────────────────────────────────

export interface BulkSubstituteAssignmentBody {
  jurorIds: string[];
  substituteIds: string[];
  confirmWarnings?: boolean;
}

export interface TeamSummary {
  id: number;
  codigo: string;
  nombre: string;
}

export type UnassignableReason = "TEAM_NOT_CONFIRMED" | "TEAM_NOT_GRADABLE";

export interface BulkSubstituteAssignmentResult {
  message: string;
  edicion: { id: number; title: string };
  suplentes: Array<{
    id: string;
    nombre: string;
    equiposAgregados: TeamSummary[];
    equiposYaAsignados: TeamSummary[];
  }>;
  juradosCubiertos: Array<{ id: string; nombre: string; equiposCubiertos: number }>;
  juradosSinGrupos: Array<{ id: string; nombre: string }>;
  equiposNoAsignables: Array<TeamSummary & { motivo: UnassignableReason | (string & {}) }>;
  totales: { equiposCubiertos: number; asignacionesAgregadas: number; asignacionesOmitidas: number };
  advertenciasAceptadas: AssignmentWarning[];
}

/** Jurado de la edición activa tal como lo devuelve `GET /juror?participating=true`. */
export interface EditionEvaluator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jurorType: "OFFICIAL" | "BACKUP" | null;
  jurorCategory: "JUNIOR" | "SENIOR" | null;
  isProfessor: boolean;
  /** Grupos que tiene asignados en la edición activa (evaluados + sin evaluar). */
  assignedTeams: number;
}

// ─── Errores ─────────────────────────────────────────────────────────────────

/** Error del back que no se puede saltar (400, 403, 404, 500), con su `code` si viene. */
export class BulkSubstituteError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "BulkSubstituteError";
  }
}

const MESSAGE_BY_CODE: Record<string, string> = {
  SUBSTITUTE_IS_COVERED_JUROR: "Una misma persona está como jurado a cubrir y como suplente. Quítala de una de las dos listas.",
  NOT_AN_EVALUATOR: "Algún jurado elegido ya no está activo o no es jurado. Recarga la lista e inténtalo de nuevo.",
  NOT_A_SUBSTITUTE:
    "Algún suplente ya no es Suplente confirmado de la edición. Recarga la lista o márcalo como Suplente en Jurados de la edición.",
  NO_ACTIVE_EDITION: "No hay una edición activa.",
};

export const SAVE_FAILED_MESSAGE = "No se pudo asignar a los suplentes. No cambió ninguna asignación.";

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

// ─── Llamadas ────────────────────────────────────────────────────────────────

function toEvaluator(raw: Record<string, unknown>): EditionEvaluator {
  const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
  const type = raw.jurorType === "OFFICIAL" || raw.jurorType === "BACKUP" ? raw.jurorType : null;
  const category = raw.jurorCategory === "JUNIOR" || raw.jurorCategory === "SENIOR" ? raw.jurorCategory : null;
  return {
    id: String(raw.id),
    firstName: typeof raw.firstName === "string" ? raw.firstName : "",
    lastName: typeof raw.lastName === "string" ? raw.lastName : "",
    email: typeof raw.email === "string" ? raw.email : "",
    jurorType: type,
    jurorCategory: category,
    isProfessor: raw.isProfessor === true,
    assignedTeams: count(raw.evaluatedCount) + count(raw.unevaluatedCount),
  };
}

/** Jurados de la edición activa (confirmados y profesores con NRC), recorriendo todas las páginas. */
export async function fetchEditionEvaluators(): Promise<EditionEvaluator[]> {
  const rows = await fetchAllPages(async (page, limit) => {
    const res = await apiFetch(`${API_URL}/juror?includeInactive=false&participating=true&limit=${limit}&page=${page}`);
    if (!res.ok) {
      const body = await readBody(res);
      throw new BulkSubstituteError(backMessage(body) ?? "No se pudo cargar la lista de jurados.", res.status);
    }
    const body = await res.json();
    const items: Record<string, unknown>[] = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    const totalPages = typeof body?.metadata?.totalPages === "number" ? body.metadata.totalPages : 1;
    return { items, totalPages };
  });
  return rows.map(toEvaluator);
}

/**
 * Asigna los suplentes. Lanza {@link AssignmentWarningsError} con un 409 `ASSIGNMENT_WARNINGS`
 * (se repite con `confirmWarnings: true`) y {@link BulkSubstituteError} con cualquier otro error.
 * En ningún error se guarda nada.
 */
export async function assignSubstitutesInBulk(body: BulkSubstituteAssignmentBody): Promise<BulkSubstituteAssignmentResult> {
  const res = await apiFetch(`${API_URL}/juror/assignments/substitutes/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return res.json();

  const data = await readBody(res);
  const warnings = getAssignmentWarnings(res.status, data);
  if (warnings) throw new AssignmentWarningsError(backMessage(data) ?? "La asignación rompe reglas de asignación.", warnings);

  const code = typeof data?.code === "string" ? data.code : undefined;
  if (res.status >= 500) throw new BulkSubstituteError(SAVE_FAILED_MESSAGE, res.status, code);
  if (res.status === 403) throw new BulkSubstituteError("Solo el administrador puede asignar suplentes.", res.status, code);
  const message = (code && MESSAGE_BY_CODE[code]) || backMessage(data) || SAVE_FAILED_MESSAGE;
  throw new BulkSubstituteError(message, res.status, code);
}
