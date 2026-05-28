import { apiFetch } from '@/lib/api';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type EditionStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Videogame {
  id: number;
  name: string;
  descripcion?: string;
  logoUrl?: string;
  teamName?: string;
}

export interface HighlightedGame {
  editionId: number;
  videogameId: number;
  videogame: Videogame;
}

export interface Testimonial {
  id: number;
  editionId: number;
  name: string;
  role: string;
  quote: string;
}

export interface EducationalFocus {
  id: number;
  editionId: number;
  title: string;
  description?: string;
}

export interface Edition {
  id: number;
  year: number;
  semester: number; // 10 | 20 | 30
  title: string;
  startsAt: string; // ISO string
  endsAt: string;   // ISO string
  description?: string;
  description2?: string;
  alt?: string;
  status: EditionStatus;
  mainPhoto?: string;    // upload UUID interno
  mainPhotoUrl?: string; // SAS URL temporal (generada por el backend)
  photos: string[];      // array de upload UUIDs
  photosUrls?: { id: string; url: string }[];
  testimonials?: Testimonial[];
  educationalFocuses?: EducationalFocus[];
  highlightedGames?: HighlightedGame[];
}

export interface PaginatedResult<T> {
  data: T[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Combina una fecha (YYYY-MM-DD) y una hora (HH:mm) en un string ISO 8601.
 * Ejemplo: buildISODateTime("2024-11-27", "08:30") → "2024-11-27T08:30:00.000Z"
 */
export function buildISODateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

/**
 * Extrae la parte de fecha (YYYY-MM-DD) de un string ISO interpretado en hora local.
 */
export function isoToDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.substring(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extrae la parte de hora (HH:mm) de un string ISO interpretado en hora local.
 */
export function isoToTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.substring(11, 16);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

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

// ─── MIME types permitidos (sin SVG) ────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Valida un archivo de imagen en el cliente.
 * Retorna null si es válido, o un mensaje de error si no lo es.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" no es un tipo de imagen válido. Solo JPG, PNG y WEBP.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" excede el límite de 5 MB.`;
  }
  return null;
}

// ─── Ediciones ──────────────────────────────────────────────────────────────

export const fetchEditions = async (): Promise<Edition[]> => {
  const res = await apiFetch(`${API_URL}/editions?page=1&limit=100`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const result: PaginatedResult<Edition> = await res.json();
  return result.data;
};

export const fetchEditionById = async (id: number): Promise<Edition> => {
  const res = await apiFetch(`${API_URL}/editions/${id}`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const createEdition = async (data: {
  year: number;
  semester: number;
  title: string;
  startsAt: string;
  endsAt: string;
  description?: string;
  description2?: string;
  alt?: string;
}): Promise<Edition> => {
  const res = await apiFetch(`${API_URL}/editions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const updateEdition = async (
  id: number,
  data: Partial<{
    year: number;
    semester: number;
    title: string;
    startsAt: string;
    endsAt: string;
    description: string;
    description2: string;
    alt: string;
  }>,
): Promise<Edition> => {
  const res = await apiFetch(`${API_URL}/editions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const activateEdition = async (id: number): Promise<Edition> => {
  const res = await apiFetch(`${API_URL}/editions/${id}/activate`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const archiveEdition = async (id: number): Promise<Edition> => {
  const res = await apiFetch(`${API_URL}/editions/${id}/archive`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const deleteEdition = async (id: number): Promise<void> => {
  const res = await apiFetch(`${API_URL}/editions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
};

export const uploadMainPhoto = async (id: number, file: File): Promise<Edition> => {
  const formData = new FormData();
  formData.append('mainPhoto', file);
  const res = await apiFetch(`${API_URL}/editions/${id}/main-photo`, {
    method: 'POST',
    body: formData,
    // No poner Content-Type: fetch lo setea automáticamente con boundary para FormData
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const uploadPhotos = async (id: number, files: File[]): Promise<Edition> => {
  const formData = new FormData();
  files.forEach(file => formData.append('photos', file));
  const res = await apiFetch(`${API_URL}/editions/${id}/photos`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const deletePhotos = async (id: number, uploadIds: string[]): Promise<Edition> => {
  const res = await apiFetch(`${API_URL}/editions/${id}/photos`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadIds }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

// ─── Testimonios ────────────────────────────────────────────────────────────

export const fetchTestimonials = async (editionId: number): Promise<Testimonial[]> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/testimonials?page=1&limit=100`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const result: PaginatedResult<Testimonial> = await res.json();
  return result.data;
};

export const createTestimonial = async (
  editionId: number,
  data: { name: string; role: string; quote: string },
): Promise<Testimonial> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/testimonials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const updateTestimonial = async (
  editionId: number,
  id: number,
  data: Partial<{ name: string; role: string; quote: string }>,
): Promise<Testimonial> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/testimonials/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const deleteTestimonial = async (editionId: number, id: number): Promise<void> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/testimonials/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
};

// ─── Juegos Destacados ───────────────────────────────────────────────────────

export const fetchHighlightedGames = async (editionId: number): Promise<HighlightedGame[]> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/highlighted-games?page=1&limit=100`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const result: PaginatedResult<HighlightedGame> = await res.json();
  return result.data;
};

export const addHighlightedGame = async (
  editionId: number,
  videogameId: number,
): Promise<HighlightedGame> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/highlighted-games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videogameId }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const removeHighlightedGame = async (
  editionId: number,
  videogameId: number,
): Promise<void> => {
  const res = await apiFetch(
    `${API_URL}/editions/${editionId}/highlighted-games/${videogameId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(await extractErrorMessage(res));
};

// Videojuegos filtrados por edición (solo los de equipos inscritos en esa edición)
export const fetchEditionVideogames = async (editionId: number): Promise<Videogame[]> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/videogames`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

// Catálogo público global (aún usado por otros módulos)
export const fetchAllVideogames = async (): Promise<Videogame[]> => {
  const res = await fetch(`${API_URL}/videogames`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

// ─── Enfoques Educativos ─────────────────────────────────────────────────────

export const fetchEducationalFocuses = async (editionId: number): Promise<EducationalFocus[]> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/educational-focuses?page=1&limit=100`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const result: PaginatedResult<EducationalFocus> = await res.json();
  return result.data;
};

export const createEducationalFocus = async (
  editionId: number,
  data: { title: string; description?: string },
): Promise<EducationalFocus> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/educational-focuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const updateEducationalFocus = async (
  editionId: number,
  id: number,
  data: Partial<{ title: string; description: string }>,
): Promise<EducationalFocus> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/educational-focuses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
};

export const deleteEducationalFocus = async (editionId: number, id: number): Promise<void> => {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/educational-focuses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
};

export const fetchHistoricalTeams = async (editionId: number): Promise<any[]> => {
  const res = await apiFetch(`${API_URL}/historicals/historical-teams/${editionId}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(await extractErrorMessage(res));
  }
  return res.json();
};

export const fetchHistoricalTeamsWithScores = async (editionId: number): Promise<any[]> => {
  const res = await apiFetch(`${API_URL}/historicals/historical-teams-with-scores/${editionId}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(await extractErrorMessage(res));
  }
  return res.json();
};
