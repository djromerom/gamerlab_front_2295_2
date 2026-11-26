import type { Team } from "@/features/jurors/types/jurors";

/** «Núñez» → «nunez» */
const sinTildes = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Búsqueda de texto de la asignación de jurados: no distingue mayúsculas ni tildes («jose» encuentra a «José») y cada
 * palabra buscada debe aparecer en alguno de los campos, en cualquier orden («perez jose» encuentra a «José Pérez»).
 * Sin texto, todo coincide.
 */
export function matchesSearch(fields: Array<string | null | undefined>, search: string): boolean {
  const words = sinTildes(search).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = sinTildes(fields.filter(Boolean).join(" "));
  return words.every((word) => text.includes(word));
}

/** Búsqueda de la lista «Equipos»: por videojuego, nombre del equipo o líder, que es lo que muestra cada tarjeta. */
export function searchTeams(teams: Team[], search: string): Team[] {
  return teams.filter((team) => matchesSearch([team.game, team.name, team.leaderName], search));
}
