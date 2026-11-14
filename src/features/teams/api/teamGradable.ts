import { apiFetch } from '@/lib/api';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

// ─── Tipos (contrato ARK-209 / HU-39 del back) ──────────────────────────────

export interface RemovedJuror {
  id: string;
  nombre: string;
}

export interface TeamGradableResult {
  id: number;
  teamCode: string;
  teamName: string;
  notGradable: boolean;
  /** Solo viene si al marcar el equipo se le retiraron jurados */
  juradosRetirados?: RemovedJuror[];
  /** Solo viene si al marcar el equipo se le retiraron jurados */
  avisoAsignacion?: string;
}

/** Error del back con su código HTTP y, si viene, el `code` (TEAM_NOT_IN_ACTIVE_EDITION, …). */
export class TeamGradableError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

const MESSAGE_BY_CODE: Record<string, string> = {
  TEAM_NOT_IN_ACTIVE_EDITION:
    'Solo se puede marcar o desmarcar un equipo de la edición activa.',
};

const MESSAGE_BY_STATUS: Record<number, string> = {
  403: 'Solo el administrador puede marcar un equipo como presentador externo.',
  404: 'El equipo no existe o está inactivo.',
};

async function toError(res: Response): Promise<TeamGradableError> {
  let code: string | undefined;
  let message: string | undefined;
  try {
    const body = await res.json();
    code = typeof body?.code === 'string' ? body.code : undefined;
    if (typeof body?.message === 'string' && body.message) message = body.message;
    else if (Array.isArray(body?.message)) message = body.message.join(', ');
  } catch {
    // no es JSON: queda el mensaje por defecto
  }
  // El código conocido manda sobre el texto del back; si no hay texto, se usa el del status
  const text =
    (code && MESSAGE_BY_CODE[code]) ||
    message ||
    MESSAGE_BY_STATUS[res.status] ||
    'No se pudo cambiar la marca de presentador externo.';
  return new TeamGradableError(text, res.status, code);
}

/**
 * HU-39 (ARK-209): marca o desmarca un equipo como «no calificable» (presentador externo).
 * Solo el administrador. Al marcarlo, el back le retira los jurados y lo avisa en `avisoAsignacion`.
 */
export async function setTeamNotGradable(
  teamId: number,
  notGradable: boolean,
): Promise<TeamGradableResult> {
  const res = await apiFetch(`${API_URL}/teams/${teamId}/gradable`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ notGradable }),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}
