import { apiFetch } from '@/lib/api';
import type { EditionStatus, PaginatedResult } from '@/api/editions';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos (contratos HU-25 y HU-28, docs/frontend/ del back) ──────────────────

export type JurorEditionStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
// AUTOMATIC = profesor con NRC activo en la edición (no editable)
export type JurorEditionListStatus = JurorEditionStatus | 'AUTOMATIC';
export type JurorEditionType = 'OFFICIAL' | 'BACKUP';
// ENROLLED = tiene fila en la edición: jurado externo o profesor sin NRC (HU-28)
// PROFESSOR_NRC = profesor con NRC activo en la edición
export type JurorEditionSource = 'ENROLLED' | 'PROFESSOR_NRC';
export type JurorCategoryLabel = 'Junior' | 'Senior' | 'Sin categoría';

export interface EditionJurorItem {
  jurorId: string;
  firstName: string;
  lastName: string;
  email: string;
  category: JurorCategoryLabel;
  type: JurorEditionType | null; // null en profesores automáticos
  status: JurorEditionListStatus;
  source: JurorEditionSource;
  updatedAt: string | null;
}

export interface EditionJurorsList extends PaginatedResult<EditionJurorItem> {
  edition: { id: number; title: string; status: EditionStatus; writable: boolean };
  counts: Record<JurorEditionListStatus, number>;
}

export interface EditionJurorsQuery {
  editionId?: number;
  status?: JurorEditionListStatus;
  type?: JurorEditionType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ImportPreviousResult {
  sourceEditionId: number;
  created: number;
  skipped: number;
  fallback: boolean;
}

// NOT_ENROLLED = sin fila en la edición (un profesor sin NRC se inscribe por correo)
// IS_PROFESSOR = profesor automático: tiene NRC activo en la edición
export type StatusRowError = 'NOT_ENROLLED' | 'IS_PROFESSOR';

export interface StatusItem {
  jurorId: string;
  status: JurorEditionStatus;
  type?: JurorEditionType;
}

export interface UpdateStatusesResult {
  results: { jurorId: string; ok: boolean; error?: StatusRowError }[];
  declined: number;
}

export const MAX_STATUS_ITEMS = 500;

export const STATUS_LABEL: Record<JurorEditionListStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  DECLINED: 'Declinó',
  AUTOMATIC: 'Profesor con NRC',
};

export const TYPE_LABEL: Record<JurorEditionType, string> = {
  OFFICIAL: 'Oficial',
  BACKUP: 'Suplente',
};

export const ROW_ERROR_MESSAGE: Record<StatusRowError, string> = {
  NOT_ENROLLED: 'No está en esta edición: inscríbalo por correo',
  IS_PROFESSOR: 'Profesor con NRC en la edición: es jurado automático',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Error con el código HTTP: la página distingue 404 y 409 al inscribir. */
export class JurorEditionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function toError(res: Response, fallback: string): Promise<JurorEditionError> {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') return new JurorEditionError(body.message, res.status);
    if (Array.isArray(body?.message)) return new JurorEditionError(body.message.join(', '), res.status);
  } catch {
    // no es JSON
  }
  return new JurorEditionError(fallback, res.status);
}

const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * Cuántos Pendientes pasarán a Declinó con `declineRemaining`: los Pendientes de la
 * edición (sin búsqueda ni tipo) menos los seleccionados que hoy están Pendientes.
 */
export function pendingToDecline(totalPending: number, selected: EditionJurorItem[]): number {
  const selectedPending = selected.filter((j) => j.status === 'PENDING').length;
  return Math.max(0, totalPending - selectedPending);
}

// ─── Jurados de la edición ──────────────────────────────────────────────────

/** Sin `editionId` el back usa la edición activa. `search` se omite con menos de 2 caracteres. */
export const fetchEditionJurors = async (
  query: EditionJurorsQuery = {},
): Promise<EditionJurorsList> => {
  const params = new URLSearchParams();
  if (query.editionId) params.set('editionId', String(query.editionId));
  if (query.status) params.set('status', query.status);
  if (query.type) params.set('type', query.type);
  const search = query.search?.trim();
  if (search && search.length >= 2) params.set('search', search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const qs = params.toString();
  const res = await apiFetch(`${API_URL}/juror-edition${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw await toError(res, 'No se pudo cargar la lista de jurados.');
  return res.json();
};

export const importPreviousJurors = async (editionId?: number): Promise<ImportPreviousResult> => {
  const res = await apiFetch(
    `${API_URL}/juror-edition/import-previous`,
    jsonRequest('POST', editionId ? { editionId } : {}),
  );
  if (!res.ok) throw await toError(res, 'No se pudieron traer los jurados de la edición anterior.');
  return res.json();
};

export const updateJurorStatuses = async (body: {
  editionId?: number;
  declineRemaining?: boolean;
  items: StatusItem[];
}): Promise<UpdateStatusesResult> => {
  const res = await apiFetch(`${API_URL}/juror-edition/status`, jsonRequest('PATCH', body));
  if (!res.ok) throw await toError(res, 'No se pudieron actualizar los jurados.');
  return res.json();
};

export const enrollJurorByEmail = async (body: {
  email: string;
  editionId?: number;
  type?: JurorEditionType;
}): Promise<EditionJurorItem> => {
  const res = await apiFetch(`${API_URL}/juror-edition/enroll`, jsonRequest('POST', body));
  if (!res.ok) throw await toError(res, 'No se pudo inscribir al jurado.');
  return res.json();
};
