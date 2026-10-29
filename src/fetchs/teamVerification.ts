import { apiFetch } from '@/lib/api';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface MyVerificationCode {
  teamId: number;
  teamCode: string;
  verificationCode: string | null; // null en equipos de colegios (N0)
}

export interface TeamVerificationCode {
  teamId: number;
  code: string;
}

/** { [teamId]: true } si el jurado ya verificó el grupo o si el grupo no exige código (N0). */
export type TeamVerificationStatus = Record<number, boolean>;

/** Error HTTP que conserva el status para distinguir el bloqueo por intentos (429). */
export class TeamVerificationError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Los equipos de colegios (N0) no tienen código de verificación.
 */
export const isCollegeTeamCode = (teamCode?: string): boolean =>
  !!teamCode && teamCode.toUpperCase().startsWith('N0-');

/**
 * Extrae el mensaje de error de una respuesta HTTP con body JSON.
 */
async function toError(res: Response): Promise<TeamVerificationError> {
  let message = `Error ${res.status}`;
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') message = body.message;
    else if (Array.isArray(body?.message)) message = body.message.join(', ');
  } catch {
    // no es JSON
  }
  return new TeamVerificationError(message, res.status);
}

// ─── Estudiante ─────────────────────────────────────────────────────────────

export const fetchMyVerificationCode = async (): Promise<MyVerificationCode> => {
  const res = await apiFetch(`${API_URL}/team-verification/my-code`);
  if (!res.ok) throw await toError(res);
  return res.json();
};

// ─── Jurado ─────────────────────────────────────────────────────────────────

/**
 * Estado de verificación de varios grupos (máximo 100 por llamada).
 */
export const fetchTeamVerificationStatus = async (
  teamIds: number[],
): Promise<TeamVerificationStatus> => {
  const res = await apiFetch(
    `${API_URL}/team-verification/status?teamIds=${encodeURIComponent(teamIds.join(','))}`,
  );
  if (!res.ok) throw await toError(res);
  return res.json();
};

/**
 * El jurado digita el código que el estudiante ve en su panel. Se pide una vez por grupo.
 */
export const verifyTeamCode = async (teamId: number, code: string): Promise<void> => {
  const res = await apiFetch(`${API_URL}/team-verification/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, code }),
  });
  if (!res.ok) throw await toError(res);
};

// ─── Administrador ──────────────────────────────────────────────────────────

/**
 * Consulta el código de un equipo. Queda registrado en el backend.
 */
export const fetchTeamVerificationCode = async (
  teamId: number,
): Promise<TeamVerificationCode> => {
  const res = await apiFetch(`${API_URL}/team-verification/${teamId}`);
  if (!res.ok) throw await toError(res);
  return res.json();
};

/**
 * Regenera el código de un equipo (por pérdida). Invalida el código anterior.
 */
export const regenerateTeamVerificationCode = async (
  teamId: number,
): Promise<TeamVerificationCode> => {
  const res = await apiFetch(`${API_URL}/team-verification/${teamId}/regenerate`, {
    method: 'POST',
  });
  if (!res.ok) throw await toError(res);
  return res.json();
};
