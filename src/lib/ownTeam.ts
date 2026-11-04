import { apiFetch } from "@/lib/api";
import { fetchEditions } from "@/fetchs/editions";
import { NotEnrolledError } from "@/lib/notEnrolled";
import type { Team } from "@/types/Team";

let activeEditionPromise: Promise<number> | null = null;
let teamsPromise: Promise<Team[]> | null = null;

export function resetOwnTeamCacheForTests(): void {
  activeEditionPromise = null;
  teamsPromise = null;
}

export function resolveOwnTeamForEdition(
  teams: Team[],
  editionId: number,
): Team | null {
  return teams.find(
    (team) => team.isMine === true && team.editionId === editionId,
  ) ?? null;
}

export async function fetchOwnTeamForEdition(editionId?: number): Promise<Team> {
  let resolvedEditionId = editionId;

  if (!resolvedEditionId) {
    activeEditionPromise ??= fetchEditions().then((editions) => {
      const activeEdition = editions.find((edition) => edition.status === "ACTIVE");
      if (!activeEdition) {
        throw new Error("No hay una edición activa.");
      }
      return activeEdition.id;
    });
    try {
      resolvedEditionId = await activeEditionPromise;
    } catch (error) {
      activeEditionPromise = null;
      throw error;
    }
  }

  teamsPromise ??= (async () => {
    const response = await apiFetch(
      `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`,
      { credentials: "include" },
    );
    if (!response.ok) {
      throw new Error("No fue posible cargar los equipos.");
    }

    const payload = await response.json() as Team[] | { data?: Team[]; items?: Team[] };
    if (Array.isArray(payload)) return payload;
    return payload.data ?? payload.items ?? [];
  })();

  let teams: Team[];
  try {
    teams = await teamsPromise;
  } catch (error) {
    teamsPromise = null;
    throw error;
  }
  const ownTeam = resolveOwnTeamForEdition(teams, resolvedEditionId);
  if (!ownTeam) {
    throw new NotEnrolledError();
  }
  return ownTeam;
}
