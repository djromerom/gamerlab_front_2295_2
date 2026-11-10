import { apiFetch } from '@/lib/api';
import { fileNameFromDisposition, saveBlobAsFile } from '@/fetchs/jurorsExport';
import type { EditionStatus } from '@/fetchs/editions';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos (contrato ARK-194 / HU-33 del back) ──────────────────────────────

export interface ExternalPresenter {
  id: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: string | null;
  presentationTitle: string | null;
  editionId: number;
  /** null: todavía no ha entrado (cuenta sin activar) */
  lastSignInAt: string | null;
  /** Fecha del último envío del certificado; null si no se ha enviado */
  certificateSentAt: string | null;
  createdAt: string;
}

export interface ExternalPresentersList {
  /** null cuando no hay edición activa y no se pidió otra */
  edition: { id: number; title: string; status: EditionStatus; readOnly: boolean } | null;
  presenters: ExternalPresenter[];
}

export interface MyExternalPresenter extends ExternalPresenter {
  edition: { id: number; title: string };
}

export interface CreateExternalPresenterInput {
  email: string;
  confirmEmail: string;
  firstName: string;
  lastName: string;
  organization?: string;
  presentationTitle?: string;
}

/** `null` en organización o título los borra; si se omiten, no cambian. */
export interface UpdateExternalPresenterInput {
  firstName?: string;
  lastName?: string;
  organization?: string | null;
  presentationTitle?: string | null;
}

export interface BulkFailure {
  email: string;
  code: string;
  message: string;
}

export interface BulkResult {
  successful: ExternalPresenter[];
  failed: BulkFailure[];
  message: string;
}

export interface SendAllResult {
  sent: number;
  failed: { id: number; email: string; error: string }[];
  message: string;
}

export const MAX_BULK_PRESENTERS = 100;
export const EXPORT_FALLBACK_NAME = 'presentadores_externos.xlsx';

// ─── Errores ────────────────────────────────────────────────────────────────

/** Error del back con su código HTTP y, si viene, el `code` (EMAIL_IN_USE_BY_OTHER_ROLE, …). */
export class ExternalPresenterError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function toError(res: Response, fallback: string): Promise<ExternalPresenterError> {
  try {
    const body = await res.json();
    const code = typeof body?.code === 'string' ? body.code : undefined;
    if (typeof body?.message === 'string' && body.message) {
      return new ExternalPresenterError(body.message, res.status, code);
    }
    if (Array.isArray(body?.message)) {
      return new ExternalPresenterError(body.message.join(', '), res.status, code);
    }
  } catch {
    // no es JSON: queda el mensaje por defecto
  }
  return new ExternalPresenterError(fallback, res.status);
}

const jsonRequest = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const editionQuery = (editionId?: number) => (editionId ? `?editionId=${editionId}` : '');

// ─── Administrador ──────────────────────────────────────────────────────────

/** Sin `editionId` el back usa la edición activa. */
export async function fetchExternalPresenters(editionId?: number): Promise<ExternalPresentersList> {
  const res = await apiFetch(`${API_URL}/external-presenters${editionQuery(editionId)}`);
  if (!res.ok) throw await toError(res, 'No se pudo cargar la lista de presentadores.');
  return res.json();
}

export async function createExternalPresenter(
  input: CreateExternalPresenterInput,
): Promise<ExternalPresenter> {
  const res = await apiFetch(`${API_URL}/external-presenters`, jsonRequest('POST', input));
  if (!res.ok) throw await toError(res, 'No se pudo registrar al presentador.');
  return res.json();
}

export async function createExternalPresentersBulk(
  presenters: CreateExternalPresenterInput[],
): Promise<BulkResult> {
  const res = await apiFetch(
    `${API_URL}/external-presenters/bulk`,
    jsonRequest('POST', { presenters }),
  );
  if (!res.ok) throw await toError(res, 'No se pudieron registrar los presentadores.');
  return res.json();
}

export async function updateExternalPresenter(
  id: number,
  input: UpdateExternalPresenterInput,
): Promise<ExternalPresenter> {
  const res = await apiFetch(`${API_URL}/external-presenters/${id}`, jsonRequest('PATCH', input));
  if (!res.ok) throw await toError(res, 'No se pudo guardar el presentador.');
  return res.json();
}

export async function removeExternalPresenter(id: number): Promise<void> {
  const res = await apiFetch(`${API_URL}/external-presenters/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await toError(res, 'No se pudo quitar al presentador.');
}

export async function sendExternalPresenterCertificate(
  id: number,
): Promise<{ id: number; email: string; certificateSentAt: string }> {
  const res = await apiFetch(
    `${API_URL}/external-presenters/${id}/certificate`,
    jsonRequest('POST'),
  );
  if (!res.ok) throw await toError(res, 'No se pudo enviar el certificado.');
  return res.json();
}

export async function sendAllExternalPresenterCertificates(): Promise<SendAllResult> {
  const res = await apiFetch(
    `${API_URL}/external-presenters/certificates/send-all`,
    jsonRequest('POST'),
  );
  if (!res.ok) throw await toError(res, 'No se pudieron enviar los certificados.');
  return res.json();
}

/** Descarga el Excel de la edición (por defecto la activa). Devuelve el nombre del archivo. */
export async function downloadExternalPresentersExport(editionId?: number): Promise<string> {
  const res = await apiFetch(`${API_URL}/external-presenters/export${editionQuery(editionId)}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw await toError(res, 'No se pudo exportar la lista de presentadores.');
  const fileName =
    fileNameFromDisposition(res.headers.get('content-disposition')) ?? EXPORT_FALLBACK_NAME;
  saveBlobAsFile(await res.blob(), fileName);
  return fileName;
}

// ─── Presentador externo ────────────────────────────────────────────────────

/** Su registro en la edición activa (o el más reciente). 404 si no tiene registro activo. */
export async function fetchMyExternalPresenter(): Promise<MyExternalPresenter> {
  const res = await apiFetch(`${API_URL}/external-presenters/me`);
  if (!res.ok) throw await toError(res, 'No se pudo cargar tu registro.');
  return res.json();
}
