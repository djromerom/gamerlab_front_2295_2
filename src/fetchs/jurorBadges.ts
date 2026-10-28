import { apiFetch } from '@/lib/api';

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
 * Descarga el PDF imprimible. Sin jurorIds incluye todas las escarapelas.
 */
export const downloadJurorBadgesPdf = async (jurorIds?: string[]): Promise<void> => {
  const query = jurorIds?.length
    ? `?jurorIds=${encodeURIComponent(jurorIds.join(','))}`
    : '';
  const res = await apiFetch(`${API_URL}/juror-badges/pdf${query}`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'escarapelas.pdf';
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
