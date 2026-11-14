/**
 * ARK-189: equipos del diálogo «Asignar equipo» (Personal → Jurados) con su nivel.
 * El back (ARK-188) manda `teamCode`, `nivel` y `nivelEtiqueta` en
 * `GET /teams/incomplete-jurors` y `GET /juror/:id/teams`, con la misma regla de HU-08.
 */

/** Jurados que necesita cada equipo; `incomplete-jurors` trae los que tienen menos. */
export const JURORS_PER_TEAM = 3;

export interface LevelTeam {
  id: number;
  name: string;
  videogame: string;
  teamCode: string;
  /** 0 = colegios; null si el código no trae nivel. */
  level: number | null;
  levelLabel: string;
  jurorCount: number;
}

/** Filtro de nivel del diálogo: "all", "none" (sin nivel) o el número del nivel ("0", "1"...). */
export type LevelFilter = string;

export const ALL_LEVELS: LevelFilter = "all";

/** Igual que `teamLevelLabel` del back. */
export function teamLevelLabel(level: number | null): string {
  if (level === null) return "Sin nivel";
  if (level === 0) return "Colegios";
  return `Nivel ${level}`;
}

/** Igual que `extractTeamLevel` del back: `N<número>-...`. Solo es el respaldo si no llega `nivel`. */
export function levelFromTeamCode(teamCode?: string | null): number | null {
  const match = teamCode?.match(/^N(\d+)/i);
  return match?.[1] ? parseInt(match[1], 10) : null;
}

/** Equipo tal como llega de `incomplete-jurors` o de `/juror/:id/teams`. */
export interface ApiLevelTeam {
  id: number;
  nombre?: string;
  teamCode?: string;
  nivel?: number | null;
  nivelEtiqueta?: string;
  videojuego?: string | { id?: number; nombre?: string; descripcion?: string | null } | null;
  cantidadJurados?: number;
}

/**
 * Convierte un equipo de la API. `videojuego` es texto en `incomplete-jurors`
 * y un objeto `{ nombre }` en `/juror/:id/teams`.
 */
export function toLevelTeam(raw: ApiLevelTeam): LevelTeam {
  const teamCode = typeof raw?.teamCode === "string" ? raw.teamCode : "";
  const level =
    typeof raw?.nivel === "number" || raw?.nivel === null
      ? raw.nivel
      : levelFromTeamCode(teamCode);
  const videogame =
    typeof raw?.videojuego === "string" ? raw.videojuego : (raw?.videojuego?.nombre ?? "");

  return {
    id: raw?.id,
    name: raw?.nombre ?? "",
    videogame,
    teamCode,
    level,
    levelLabel:
      typeof raw?.nivelEtiqueta === "string" && raw.nivelEtiqueta
        ? raw.nivelEtiqueta
        : teamLevelLabel(level),
    jurorCount: typeof raw?.cantidadJurados === "number" ? raw.cantidadJurados : 0,
  };
}

const sinTildes = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function levelFilterValue(level: number | null): LevelFilter {
  return level === null ? "none" : String(level);
}

/** Busca por nombre del equipo, videojuego o código, sin distinguir tildes ni mayúsculas. */
export function filterTeams(
  teams: LevelTeam[],
  query: string,
  levelFilter: LevelFilter
): LevelTeam[] {
  const q = sinTildes(query);
  return teams.filter((team) => {
    if (levelFilter !== ALL_LEVELS && levelFilterValue(team.level) !== levelFilter) {
      return false;
    }
    if (!q) return true;
    return [team.name, team.videogame, team.teamCode].some((field) =>
      sinTildes(field).includes(q)
    );
  });
}

/** Niveles distintos en el orden del back: colegios, 1, 2... y «Sin nivel» al final. */
export function distinctLevels(teams: LevelTeam[]): (number | null)[] {
  const levels = [...new Set(teams.map((team) => team.level))];
  return levels.sort(
    (a, b) => (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY)
  );
}

/** Opciones del filtro de nivel, solo con los niveles que hay en la lista. */
export function levelFilterOptions(teams: LevelTeam[]) {
  return distinctLevels(teams).map((level) => ({
    value: levelFilterValue(level),
    label: teamLevelLabel(level),
  }));
}

/** Agrupa (ya filtrados) por nivel para los `<optgroup>`, conservando el orden de la lista. */
export function groupByLevel(teams: LevelTeam[]) {
  return distinctLevels(teams).map((level) => ({
    level,
    label: teamLevelLabel(level),
    teams: teams.filter((team) => team.level === level),
  }));
}

/** Niveles que ya tiene el jurado (sin los «Sin nivel», como la advertencia de HU-08). */
export function jurorLevels(jurorTeams: LevelTeam[]): number[] {
  return distinctLevels(jurorTeams).filter((level): level is number => level !== null);
}

/**
 * El equipo es de un nivel distinto a los que ya tiene el jurado: el back
 * responderá con la advertencia JUROR_MIXED_LEVELS al asignarlo.
 */
export function isOtherLevel(team: LevelTeam, levelsOfJuror: number[]): boolean {
  return (
    levelsOfJuror.length > 0 && team.level !== null && !levelsOfJuror.includes(team.level)
  );
}

export function levelsText(levels: (number | null)[]): string {
  return levels.map(teamLevelLabel).join(", ");
}
