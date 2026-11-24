import type { Team } from "@/types/team";

/** Devuelve el equipo del usuario autenticado según `isMine` (el back lo marca; sin sesión no existe). */
export function findMyTeam(teams: Team[]): Team | null {
  return teams.find((t) => t.isMine === true) ?? null;
}

/**
 * Equipo al que pertenece el usuario, sea líder o integrante (`isMember`). Solo para mostrar:
 * editar sigue siendo del líder (`findMyTeam`). Si el back aún no envía `isMember`, usa `isMine`.
 */
export function findMyMemberTeam(teams: Team[]): Team | null {
  return teams.find((t) => t.isMember === true || t.isMine === true) ?? null;
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

function teamsList(teamsData: unknown): Team[] {
  const d = teamsData as { data?: unknown; items?: unknown } | null;
  const list = Array.isArray(teamsData)
    ? teamsData
    : Array.isArray(d?.data)
      ? d.data
      : Array.isArray(d?.items)
        ? d.items
        : [];
  return list as Team[];
}

/** Extrae mi equipo de la respuesta de GET /teams (array, `{data}` o `{items}`) usando `isMine`. */
export function resolveMyTeam(teamsData: unknown): Team | null {
  return findMyTeam(teamsList(teamsData));
}

/** Como `resolveMyTeam`, pero también encuentra el equipo del integrante que no es líder. */
export function resolveMyMemberTeam(teamsData: unknown): Team | null {
  return findMyMemberTeam(teamsList(teamsData));
}
