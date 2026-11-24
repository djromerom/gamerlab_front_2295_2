import { apiFetch } from "@/lib/api";
import { NotEnrolledError } from "@/lib/notEnrolled";
import type { Team } from "@/types/team";
import { resolveMyMemberTeam, resolveMyTeam } from "@/lib/opaqueKeys";

let cachedUserId: string | null = null;
let teamsPromise: Promise<unknown> | null = null;
let cacheTimestamp = 0;
const OWN_TEAM_CACHE_TTL_MS = 30_000;

export function resetOwnTeamCacheForTests(): void {
  cachedUserId = null;
  teamsPromise = null;
  cacheTimestamp = 0;
}

async function fetchTeams(userId: string): Promise<unknown> {
  if (cachedUserId !== userId) {
    cachedUserId = userId;
    teamsPromise = null;
    cacheTimestamp = 0;
  } else if (teamsPromise && Date.now() - cacheTimestamp >= OWN_TEAM_CACHE_TTL_MS) {
    teamsPromise = null;
    cacheTimestamp = 0;
  }

  teamsPromise ??= (async () => {
    const response = await apiFetch(
      `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`,
      { credentials: "include" },
    );
    if (!response.ok) {
      throw new Error("No fue posible cargar los equipos.");
    }

    return await response.json() as unknown;
  })();
  if (cacheTimestamp === 0) cacheTimestamp = Date.now();

  try {
    return await teamsPromise;
  } catch (error) {
    teamsPromise = null;
    throw error;
  }
}

/** Equipo que lidera el usuario en la edición activa. Para editar: solo el líder. */
export async function fetchOwnTeam(userId: string): Promise<Team> {
  const ownTeam = resolveMyTeam(await fetchTeams(userId));
  if (!ownTeam) {
    throw new NotEnrolledError();
  }
  return ownTeam;
}

/**
 * Equipo al que pertenece el usuario en la edición activa, sea líder o integrante. Solo para
 * mostrar (inicio, calificaciones recibidas); las pantallas de edición usan `fetchOwnTeam`.
 */
export async function fetchMemberTeam(userId: string): Promise<Team> {
  const team = resolveMyMemberTeam(await fetchTeams(userId));
  if (!team) {
    throw new NotEnrolledError();
  }
  return team;
}
