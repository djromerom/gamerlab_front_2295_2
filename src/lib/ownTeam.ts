import { apiFetch } from "@/lib/api";
import { NotEnrolledError } from "@/lib/notEnrolled";
import type { Team } from "@/types/Team";
import { resolveMyTeam } from "@/lib/opaqueKeys";

let cachedUserId: string | null = null;
let teamsPromise: Promise<unknown> | null = null;
let cacheTimestamp = 0;
const OWN_TEAM_CACHE_TTL_MS = 30_000;

export function resetOwnTeamCacheForTests(): void {
  cachedUserId = null;
  teamsPromise = null;
  cacheTimestamp = 0;
}

export async function fetchOwnTeam(userId: string): Promise<Team> {
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

  let teams: unknown;
  try {
    teams = await teamsPromise;
  } catch (error) {
    teamsPromise = null;
    throw error;
  }
  const ownTeam = resolveMyTeam(teams);
  if (!ownTeam) {
    throw new NotEnrolledError();
  }
  return ownTeam;
}
