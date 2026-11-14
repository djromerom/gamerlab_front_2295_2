import { apiFetch } from '@/lib/api';
import type { EditionStatus } from '@/fetchs/editions';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos (contrato ARK-129 / HU-26: GET /students/participation) ─────────

export type ParticipationVideogameStatus = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO';

/** Edición de un listado. Solo la activa acepta cambios; las demás son historial. */
export interface ListEdition {
  id: number;
  title: string;
  status: EditionStatus;
  readOnly: boolean;
}

export interface EditionStudentItem {
  memberId: number;
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  /** Integrante activo en su equipo de esta edición. */
  isActive: boolean;
  isLeader: boolean;
  team: { id: number; teamName: string; teamCode: string; isActive: boolean };
  /** Por edición: el videojuego del equipo. */
  videogameStatus: ParticipationVideogameStatus | null;
  /** Global: correo verificado. null si el integrante no tiene cuenta. */
  accountStatus: string | null;
}

export interface EditionStudentsList {
  edition: ListEdition | null;
  summary: {
    total: number;
    active: number;
    inactive: number;
    byVideogameStatus: Record<ParticipationVideogameStatus, number>;
  };
  data: EditionStudentItem[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export interface EditionStudentsQuery {
  editionId?: number;
  videogameStatus?: ParticipationVideogameStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export class EditionStudentsError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Arma la consulta. Sin `editionId` el back usa la edición activa; `search` necesita 2 caracteres. */
export function editionStudentsQueryString(query: EditionStudentsQuery = {}): string {
  const params = new URLSearchParams();
  if (query.editionId) params.set('editionId', String(query.editionId));
  if (query.videogameStatus) params.set('videogameStatus', query.videogameStatus);
  const search = query.search?.trim();
  if (search && search.length >= 2) params.set('search', search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  return params.toString();
}

export const fetchEditionStudents = async (
  query: EditionStudentsQuery = {},
): Promise<EditionStudentsList> => {
  const qs = editionStudentsQueryString(query);
  const res = await apiFetch(`${API_URL}/students/participation${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    let message = 'No se pudo cargar la lista de estudiantes.';
    try {
      const body = await res.json();
      if (typeof body?.message === 'string') message = body.message;
      else if (Array.isArray(body?.message)) message = body.message.join(', ');
    } catch {
      // no es JSON
    }
    throw new EditionStudentsError(message, res.status);
  }
  return res.json();
};

/** `GET /teams` con la edición: sin `editionId` el back devuelve la activa. */
export function teamsUrl(apiBase: string, params: { page?: number; limit?: number; editionId?: number }): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.editionId) search.set('editionId', String(params.editionId));
  const qs = search.toString();
  return `${apiBase}/teams${qs ? `?${qs}` : ''}`;
}
