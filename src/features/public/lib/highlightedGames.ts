import type { HighlightedEdition, StudentHighlightedGame } from "@/features/public/api/highlightedGames";

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

export type WebPlay = "playable" | "noFile" | "historicalPending";

/**
 * Si el destacado se puede abrir en la cabina: necesita zip, y por ahora solo los juegos vivos tienen dónde jugarse
 * (/play-game/:id). Los históricos esperan el endpoint de HU-40 (ARK-226).
 */
export function webPlay(game: StudentHighlightedGame): WebPlay {
  if (!game.hasGameFile) return "noFile";
  return game.play.type === "live" ? "playable" : "historicalPending";
}

/** Página del juego dentro de la cabina (sin la barra de la app) */
export function playerUrl(game: StudentHighlightedGame): string {
  return `/play-game/${game.play.id}?embed=1`;
}
