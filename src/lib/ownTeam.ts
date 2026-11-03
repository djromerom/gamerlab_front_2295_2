import { apiFetch } from "@/lib/api";
import { fetchEditions } from "@/fetchs/editions";
import { NotEnrolledError } from "@/lib/notEnrolled";
import type { Team } from "@/types/Team";

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
    const editions = await fetchEditions();
    const activeEdition = editions.find((edition) => edition.status === "ACTIVE");
    if (!activeEdition) {
      throw new Error("No hay una edición activa.");
    }
    resolvedEditionId = activeEdition.id;
  }

  const response = await apiFetch(
    `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`,
    { credentials: "include" },
  );
  if (!response.ok) {
    throw new Error("No fue posible cargar los equipos.");
  }

  const payload = await response.json() as Team[] | { data?: Team[] };
  const teams = Array.isArray(payload) ? payload : payload.data ?? [];
  const ownTeam = resolveOwnTeamForEdition(teams, resolvedEditionId);
  if (!ownTeam) {
    throw new NotEnrolledError();
  }
  return ownTeam;
}
