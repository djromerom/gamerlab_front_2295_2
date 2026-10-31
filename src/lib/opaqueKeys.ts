import type { Team } from "@/types/Team";

/** Devuelve el equipo del usuario autenticado según `isMine` (el back lo marca; sin sesión no existe). */
export function findMyTeam(teams: Team[]): Team | null {
  return teams.find((t) => t.isMine === true) ?? null;
}

/**
 * Indica si un evento `likes:updated` lo provocó el usuario actual (otra pestaña suya),
 * comparando la clave opaca `triggerKey` con `likeKey` de `/auth/me`.
 */
export function isOwnLikeEvent(
  payload: { triggerKey?: string },
  likeKey?: string,
): boolean {
  return !!likeKey && payload.triggerKey === likeKey;
}

/** Extrae mi equipo de la respuesta de GET /teams (array, `{data}` o `{items}`) usando `isMine`. */
export function resolveMyTeam(teamsData: unknown): Team | null {
  const d = teamsData as { data?: unknown; items?: unknown } | null;
  const list = Array.isArray(teamsData)
    ? teamsData
    : Array.isArray(d?.data)
      ? d.data
      : Array.isArray(d?.items)
        ? d.items
        : [];
  return findMyTeam(list as Team[]);
}
