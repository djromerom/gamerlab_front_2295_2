import { apiFetch } from '@/lib/api';
import { fileNameFromDisposition } from '@/features/jurors/assignment/api/jurorsExport';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type BadgeCategory = 'Senior' | 'Junior' | 'Sin categoría';

export interface JurorBadge {
  jurorId: string;
  name: string;
  category: BadgeCategory;
  token: string; // contenido del QR; solo visible para Administrador
}

export interface JurorBadgesList {
  editionId: number;
  data: JurorBadge[];
}

export interface SkippedJuror {
  jurorId: string;
  name?: string; // el back aún no lo envía; se muestra cuando lo incluya
  reason: string;
}

export interface GenerateBadgesResult {
  editionId: number;
  created: number;
  existing: number;
  skipped: SkippedJuror[];
}

/**
 * Tamaño de la hoja del PDF. La escarapela mide lo mismo en los dos (5,4 x 6 cm, solo nombre y
 * QR de 5 cm), así que el corte es igual; cambia cuántas caben por hoja.
 */
export type BadgePaperSize = 'TABLOID' | 'LETTER';

export const DEFAULT_BADGE_PAPER_SIZE: BadgePaperSize = 'TABLOID';

export const BADGE_PAPER_OPTIONS: ReadonlyArray<{
  value: BadgePaperSize;
  label: string;
  perPage: number;
  fileName: string;
}> = [
  { value: 'TABLOID', label: 'Tabloide', perPage: 35, fileName: 'escarapelas-tabloide.pdf' },
  { value: 'LETTER', label: 'Carta', perPage: 15, fileName: 'escarapelas-carta.pdf' },
];

export interface RegenerateBadgeResult {
  jurorId: string;
  editionId: number;
  token: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extrae el mensaje de error de una respuesta HTTP con body JSON.
 */
async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') return body.message;
    if (Array.isArray(body?.message)) return body.message.join(', ');
  } catch {
    // no es JSON
  }
  return `Error ${res.status}`;
}

// ─── Escarapelas ────────────────────────────────────────────────────────────

/**
 * Genera las escarapelas faltantes de la edición activa. Idempotente.
 * Sin jurorIds se generan todas.
 */
export const generateJurorBadges = async (
  jurorIds?: string[],
): Promise<GenerateBadgesResult> => {
  const res = await apiFetch(`${API_URL}/juror-badges/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jurorIds?.length ? { jurorIds } : {}),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const fetchJurorBadges = async (): Promise<JurorBadgesList> => {
  const res = await apiFetch(`${API_URL}/juror-badges`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

/**
 * Descarga el PDF imprimible en la hoja elegida (tabloide: 35 por hoja; carta: 15).
 * Sin jurorIds incluye todas las escarapelas.
 */
export const downloadJurorBadgesPdf = async (
  jurorIds?: string[],
  paper: BadgePaperSize = DEFAULT_BADGE_PAPER_SIZE,
): Promise<void> => {
  const params = new URLSearchParams({ paper });
  if (jurorIds?.length) params.set('jurorIds', jurorIds.join(','));
  const res = await apiFetch(`${API_URL}/juror-badges/pdf?${params.toString()}`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));

  const fallbackName =
    BADGE_PAPER_OPTIONS.find((option) => option.value === paper)?.fileName ??
    'escarapelas.pdf';
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    fileNameFromDisposition(res.headers.get('content-disposition')) ?? fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * Regenera la escarapela de un jurado. Invalida el QR anterior.
 */
export const regenerateJurorBadge = async (
  jurorId: string,
): Promise<RegenerateBadgeResult> => {
  const res = await apiFetch(`${API_URL}/juror-badges/${jurorId}/regenerate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};
