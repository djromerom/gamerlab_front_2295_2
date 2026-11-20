import type { Videogame } from "@/api/editions";
import type { StudentHighlightedGame } from "@/features/public/api/highlightedGames";
import type { HistoricalVideogame } from "@/features/editions/api/highlightedGames";

/** Un juego del selector de destacados: en vivo (Videogame) o histórico (HistoricalVideogame). */
export interface SelectorGame {
  kind: "live" | "historical";
  /** videogameId si es en vivo, historicalVideogameId si es histórico */
  id: number;
  name: string;
  teamName?: string;
  /** true/false si se sabe si tiene zip; null si el back no lo dice (catálogo en vivo) */
  hasGameFile: boolean | null;
}

/** Clave única del juego en el selector (un id vivo y uno histórico pueden coincidir). */
export const gameKey = (game: Pick<SelectorGame, "kind" | "id">): string => `${game.kind}-${game.id}`;

/** Destacados de la edición (GET /highlighted-games?editionId=) como juegos del selector. */
export function fromHighlighted(games: StudentHighlightedGame[]): SelectorGame[] {
  return games.map((g) => ({
    kind: g.play.type,
    id: g.play.id,
    name: g.name,
    teamName: g.teamName || undefined,
    hasGameFile: g.hasGameFile,
  }));
}

/** Catálogo en vivo (GET /editions/:id/videogames): ese endpoint no dice si hay zip. */
export function fromLiveCatalog(videogames: Videogame[]): SelectorGame[] {
  return videogames.map((vg) => ({
    kind: "live",
    id: vg.id,
    name: vg.name,
    teamName: vg.teamName,
    hasGameFile: null,
  }));
}

/** Catálogo histórico de una edición archivada: tiene zip si gameFileUrl viene con valor. */
export function fromHistoricalCatalog(videogames: HistoricalVideogame[]): SelectorGame[] {
  return videogames.map((vg) => ({
    kind: "historical",
    id: vg.id,
    name: vg.name,
    hasGameFile: !!vg.gameFileUrl?.trim(),
  }));
}

const normalizeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export interface AvailableFilters {
  search?: string;
  onlyWithZip?: boolean;
}

/**
 * Juegos del catálogo que se pueden destacar:
 * - sin los que ya están destacados;
 * - sin la versión histórica de un juego que ya está destacado en vivo (en la landing saldría dos veces;
 *   el histórico no guarda el id del juego en vivo, así que se comparan por nombre);
 * - filtrados por nombre y, si se pide, solo los que tienen zip.
 * Los que tienen zip van primero y luego por nombre.
 */
export function availableGames(
  catalog: SelectorGame[],
  highlighted: SelectorGame[],
  { search = "", onlyWithZip = false }: AvailableFilters = {},
): SelectorGame[] {
  const highlightedKeys = new Set(highlighted.map(gameKey));
  const liveHighlightedNames = new Set(
    highlighted.filter((h) => h.kind === "live").map((h) => normalizeName(h.name)),
  );
  const query = normalizeName(search);

  return catalog
    .filter((g) => !highlightedKeys.has(gameKey(g)))
    .filter((g) => !(g.kind === "historical" && liveHighlightedNames.has(normalizeName(g.name))))
    .filter((g) => !onlyWithZip || g.hasGameFile === true)
    .filter((g) => !query || normalizeName(g.name).includes(query))
    .sort(
      (a, b) =>
        Number(b.hasGameFile === true) - Number(a.hasGameFile === true) ||
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
}
