/**
 * HU-38 (ARK-219 back / ARK-220 front): los equipos externos no compiten en su nivel. Forman el
 * grupo «Externos», con su propio podio. Un colegio (N0) sigue en N0 aunque tenga la marca.
 */

export const EXTERNAL_GROUP_LABEL = "Externos";

/** Nivel que indica el código del equipo (`N2-ABC-201` → 2); null si el código no lo trae. */
export function levelFromTeamCode(teamCode: string | null | undefined): number | null {
  const match = /^N(\d+)-/i.exec(teamCode?.trim() ?? "");
  return match ? Number(match[1]) : null;
}

/** Nombre de un nivel, grupo, empate o decisión: «Externos» para el grupo de externos, si no «N{nivel}». */
export function groupLabel(group: { level: number | null; external?: boolean }): string {
  if (group.external) return EXTERNAL_GROUP_LABEL;
  return group.level === null ? "Sin nivel" : `N${group.level}`;
}

/** Si un equipo compite en el grupo Externos y no en su nivel (los colegios siguen en N0). */
export function competesAsExternal(team: { isExternal?: boolean; teamCode?: string | null }): boolean {
  return Boolean(team.isExternal) && levelFromTeamCode(team.teamCode) !== 0;
}

/** Los niveles y, al final, el grupo Externos si existe. */
export function rankingGroups<T>(snapshot: { levels: T[]; external?: T | null }): T[] {
  return snapshot.external ? [...snapshot.levels, snapshot.external] : snapshot.levels;
}

/** Texto del cierre del ranking: cuenta los niveles aparte del grupo Externos. */
export function finalizeSummary(result: { teams: number; levels: Array<{ external?: boolean }> }): string {
  const levels = result.levels.filter((group) => !group.external).length;
  const hasExternal = result.levels.some((group) => group.external);
  const levelsText = `${levels} ${levels === 1 ? "nivel" : "niveles"}`;
  return `Ranking final definido: ${result.teams} grupos en ${levelsText}${hasExternal ? " y el grupo Externos" : ""}.`;
}

// ─── Vista pública (/ranking) ────────────────────────────────────────────────

/** Pestaña de la vista pública: «all», un prefijo de nivel («n1», «n0»…) o «external». */
export type PublicRankingTab = "all" | "external" | `n${number}`;

/** Qué se le pide al back por cada pestaña: los externos salen de la lista completa. */
export function publicTabQuery(tab: PublicRankingTab): string {
  return tab === "external" ? "all" : tab;
}

interface PublicTeam {
  isExternal?: boolean;
  teamCode?: string;
  levelPosition?: number | null;
}

/**
 * Equipos que muestra cada pestaña. En un nivel no van los externos (compiten aparte); en
 * «Externos» van solo ellos, ordenados por su puesto dentro del grupo. «Todos» no cambia.
 */
export function publicTeamsFor<T extends PublicTeam>(tab: PublicRankingTab, teams: T[]): T[] {
  if (tab === "all") return teams;
  if (tab !== "external") return teams.filter((team) => !competesAsExternal(team));
  const position = (team: T) => team.levelPosition ?? Number.POSITIVE_INFINITY;
  return teams
    .map((team, index) => ({ team, index }))
    .filter(({ team }) => competesAsExternal(team))
    .sort((a, b) => position(a.team) - position(b.team) || a.index - b.index)
    .map(({ team }) => team);
}
