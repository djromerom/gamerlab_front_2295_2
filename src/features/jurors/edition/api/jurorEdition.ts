import { apiFetch } from '@/lib/api';
import type { EditionStatus, PaginatedResult } from '@/api/editions';
import { fileNameFromDisposition, saveBlobAsFile } from '@/features/jurors/assignment/api/jurorsExport';

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
  /** HU-24: se dio de alta el día de la feria (para revisarlo después). Opcional hasta que el back lo despliegue. */
  walkIn?: boolean;
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

// ─── Importar desde Excel (contrato HU-49, ARK-280) ─────────────────────────

export type JurorImportResultCode = 'CREATED' | 'CONFIRMED' | 'ALREADY_CONFIRMED' | 'ERROR';
/** QUEUED = el correo para crear la contraseña (o verificar la cuenta) quedó en cola */
export type JurorImportEmailStatus = 'QUEUED' | 'NOT_NEEDED';
export type JurorImportRowError =
  | 'MISSING_FIELD'
  | 'INVALID_EMAIL'
  | 'INVALID_NAME'
  | 'INVALID_TYPE'
  | 'DUPLICATE_IN_FILE'
  | 'WRONG_ROLE'
  | 'ACCOUNT_DISABLED'
  | 'ACCOUNT_CREATION_FAILED'
  | 'UNEXPECTED';

export interface JurorImportRow {
  /** Número de fila en el Excel (la 1 es el encabezado) */
  row: number;
  email: string;
  firstName: string;
  lastName: string;
  /** null cuando la fila falló antes de leer el tipo */
  type: JurorEditionType | null;
  result: JurorImportResultCode;
  accountCreated: boolean;
  emailStatus: JurorImportEmailStatus;
  /** Solo con result ERROR; `message` ya viene en español */
  error?: JurorImportRowError;
  message?: string;
}

export interface JurorImportReport {
  edition: { id: number; title: string };
  summary: {
    total: number;
    created: number;
    confirmed: number;
    alreadyConfirmed: number;
    errors: number;
    emailsQueued: number;
  };
  rows: JurorImportRow[];
}

export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 500;
export const TEMPLATE_FALLBACK_NAME = 'plantilla-jurados.xlsx';
/** Pausa por defecto del back entre correo y correo (JUROR_IMPORT_EMAIL_DELAY_MS) */
export const IMPORT_EMAIL_DELAY_MS = 2500;

export const IMPORT_RESULT_LABEL: Record<JurorImportResultCode, string> = {
  CREATED: 'Creado',
  CONFIRMED: 'Confirmado',
  ALREADY_CONFIRMED: 'Ya estaba',
  ERROR: 'Error',
};

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

/**
 * Valida el archivo antes de subirlo (el back repite la validación).
 * Devuelve el motivo para mostrar, o null si se puede subir.
 */
export function importFileProblem(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return 'El archivo debe ser un Excel .xlsx (use la plantilla).';
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) return 'El archivo pesa más de 2 MB.';
  if (file.size === 0) return 'El archivo está vacío.';
  return null;
}

/** Importa el Excel en la edición activa (el back no recibe `editionId`). */
export const importJurorsFromExcel = async (file: File): Promise<JurorImportReport> => {
  const form = new FormData();
  form.append('file', file);
  // Sin Content-Type: el navegador arma el multipart con su boundary
  const res = await apiFetch(`${API_URL}/juror-edition/import`, { method: 'POST', body: form });
  if (res.status === 413) throw new JurorEditionError('El archivo pesa más de 2 MB.', 413);
  if (res.status === 403) {
    throw new JurorEditionError('Solo el Administrador puede importar jurados.', 403);
  }
  if (!res.ok) throw await toError(res, 'No se pudo importar el archivo.');
  return res.json();
};

/** La plantilla exige sesión: se pide con la cookie y se guarda como archivo. Devuelve el nombre. */
export const downloadJurorTemplate = async (): Promise<string> => {
  const res = await apiFetch(`${API_URL}/juror-edition/import/template`, { method: 'GET' });
  if (!res.ok) throw await toError(res, 'No se pudo descargar la plantilla.');
  const fileName =
    fileNameFromDisposition(res.headers.get('content-disposition')) ?? TEMPLATE_FALLBACK_NAME;
  saveBlobAsFile(await res.blob(), fileName);
  return fileName;
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
