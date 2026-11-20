import type { HighlightedEdition, StudentHighlightedGame } from "@/features/public/api/highlightedGames";
import { playPath } from "@/features/games/lib/gameFiles";

const SEMESTRES: Record<number, string> = { 10: "1er semestre", 20: "Intersemestral", 30: "2º semestre" };

/** «Feria 2026 · 1er semestre» (si el semestre no se conoce, el título de la edición) */
export function editionLabel(edition: HighlightedEdition): string {
  const semestre = SEMESTRES[edition.semester];
  return semestre ? `Feria ${edition.year} · ${semestre}` : edition.title || `Feria ${edition.year}`;
}

/** Ediciones que tienen destacados, sin repetir, de la más reciente a la más antigua (para el filtro) */
export function editionsOf(games: StudentHighlightedGame[]): HighlightedEdition[] {
  const porId = new Map<number, HighlightedEdition>();
  for (const g of games) if (!porId.has(g.edition.id)) porId.set(g.edition.id, g.edition);
  return [...porId.values()].sort((a, b) => b.year - a.year || b.semester - a.semester);
}

export type WebPlay = "playable" | "noFile";

/** Si el destacado se puede abrir en la cabina: necesita zip. Los en vivo y los históricos se juegan igual (HU-40). */
export function webPlay(game: StudentHighlightedGame): WebPlay {
  return game.hasGameFile ? "playable" : "noFile";
}

/** Página del juego dentro de la cabina (sin la barra de la app): /play-game/:id o /play-game/historical/:id */
export function playerUrl(game: StudentHighlightedGame): string {
  return `${playPath(game.play.type, game.play.id)}?embed=1`;
}
