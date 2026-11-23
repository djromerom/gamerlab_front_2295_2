import type { PublicPodiumTeam } from "@/features/results/api/publicPodium";

/** HU-48 (ARK-307): el /ranking público muestra solo el podio de cada nivel, sin notas. */

const LEVEL_LABELS: Record<number, string> = {
  1: "Primer Semestre",
  2: "Segundo Semestre",
  3: "Tercer Semestre",
  4: "Cuarto Semestre",
  10: "Décimo Semestre",
  0: "Colegios",
};

/** Orden de las pestañas: los semestres y al final Colegios (como antes); otro nivel va antes de Colegios. */
const LEVEL_ORDER = [1, 2, 3, 4, 10];

export function levelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? `Nivel ${level}`;
}

function levelRank(level: number): number {
  if (level === 0) return Number.MAX_SAFE_INTEGER;
  const index = LEVEL_ORDER.indexOf(level);
  return index >= 0 ? index : LEVEL_ORDER.length + level;
}

export interface PodiumLevel {
  level: number;
  label: string;
  /** Puestos 1.º, 2.º y 3.º; `undefined` si el nivel tiene menos de 3 equipos con nota (CU-48 A1). */
  places: [PublicPodiumTeam | undefined, PublicPodiumTeam | undefined, PublicPodiumTeam | undefined];
}

/** Reparte las filas por nivel y las ubica por `levelPosition` (no por el índice). Solo salen los niveles que llegan. */
export function groupPodiumByLevel(rows: PublicPodiumTeam[]): PodiumLevel[] {
  const byLevel = new Map<number, PodiumLevel>();
  for (const row of rows) {
    if (row.levelPosition < 1 || row.levelPosition > 3) continue;
    const entry = byLevel.get(row.level) ?? { level: row.level, label: levelLabel(row.level), places: [undefined, undefined, undefined] };
    const index = row.levelPosition - 1;
    if (!entry.places[index]) entry.places[index] = row;
    byLevel.set(row.level, entry);
  }
  return [...byLevel.values()].sort((a, b) => levelRank(a.level) - levelRank(b.level));
}

/** Nombre principal de un puesto: el del equipo y, si no hay, el código. */
export function podiumTeamName(team: PublicPodiumTeam): string {
  return team.teamName ?? team.teamCode;
}

/** Logo del puesto: el del equipo y, si no hay, el del videojuego. */
export function podiumLogo(team: PublicPodiumTeam): string | null {
  return team.logoUrl ?? team.videogameLogoUrl;
}
