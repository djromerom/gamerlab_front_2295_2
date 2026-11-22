import { apiFetch } from '@/lib/api';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface MyVerificationCode {
  teamId: number;
  teamCode: string;
  /** null en equipos de colegios (N0) y en presentadores externos (ARK-257) */
  verificationCode: string | null;
  /** ARK-257: presentador externo, no se califica ni tiene código. Un back anterior no lo envía. */
  notGradable?: boolean;
}

export interface TeamVerificationCode {
  teamId: number;
  code: string;
}

/** { [teamId]: true } si el jurado ya verificó el grupo o si el grupo no exige código (N0 o desactivado, HU-50). */
export type TeamVerificationStatus = Record<number, boolean>;

/** Error HTTP que conserva el status para distinguir el bloqueo por intentos (429). */
export class TeamVerificationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** ISO 8601 del desbloqueo, si el 429 lo trae. */
    public readonly lockedUntil: string | null = null,
  ) {
    super(message);
  }
}

export interface TeamVerificationLock {
  locked: boolean;
  lockedUntil: string | null;
}

export interface TeamVerificationState {
  status: TeamVerificationStatus;
  /** Vacío si el backend no envía `locks` (versión anterior). */
  locks: Record<number, TeamVerificationLock>;
  /**
   * HU-50 (ARK-311): false si hoy no se le pide el código al jurado (interruptor global apagado o
   * código del equipo desactivado). Vacío si el backend es anterior: se sigue pidiendo.
   */
  required: Record<number, boolean>;
}

export interface TeamVerificationRequiredResult {
  teamId: number;
  verificationRequired: boolean;
  /** false si el equipo ya tenía ese valor (el back no registra nada). */
  changed: boolean;
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
  let lockedUntil: string | null = null;
  try {
    const body = await res.json();
    if (typeof body?.lockedUntil === 'string') lockedUntil = body.lockedUntil;
    if (typeof body?.message === 'string') message = body.message;
    else if (Array.isArray(body?.message)) message = body.message.join(', ');
  } catch {
    // no es JSON
  }
  return new TeamVerificationError(message, res.status, lockedUntil);
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
 * Estado de verificación y de bloqueo por intentos fallidos. Si el backend es anterior y responde
 * solo el mapa de estados, `locks` queda vacío (nunca se asume que viene).
 */
export const fetchTeamVerificationState = async (
  teamIds: number[],
): Promise<TeamVerificationState> => {
  const res = await apiFetch(
    `${API_URL}/team-verification/status?teamIds=${encodeURIComponent(teamIds.join(','))}&includeLocks=true`,
  );
  if (!res.ok) throw await toError(res);
  const data = await res.json();
  if (data && typeof data.status === 'object' && data.status !== null) {
    const locks = typeof data.locks === 'object' && data.locks !== null ? data.locks : {};
    const required =
      typeof data.required === 'object' && data.required !== null ? data.required : {};
    return { status: data.status, locks, required };
  }
  return { status: data ?? {}, locks: {}, required: {} };
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

/**
 * HU-50 (ARK-311): desactiva (`required: false`) o vuelve a exigir el código de un equipo.
 * No regenera el código ni borra las verificaciones hechas; el back registra quién y cuándo.
 */
export const setTeamVerificationRequired = async (
  teamId: number,
  required: boolean,
): Promise<TeamVerificationRequiredResult> => {
  const res = await apiFetch(`${API_URL}/team-verification/${teamId}/required`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ required }),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
};
