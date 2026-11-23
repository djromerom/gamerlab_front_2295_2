import type { GameKind } from "@/features/games/lib/gameFiles";

/**
 * ARK-317 (arreglo temporal): juegos en vivo que sí se juegan en el celular, porque traen controles táctiles propios.
 * Los demás siguen con el aviso «Este juego se juega en computador» (HU-40).
 *
 * 294 = Brainrot Breakout (Scroll Studios, Feria Gamer 2026 - S2), en producción. El id es del Videogame de producción:
 * en Arkad-test el mismo juego tiene otro id.
 *
 * Pendiente: reemplazar esta lista por un campo del videojuego que el admin active (ticket de seguimiento en Jira).
 */
const MOBILE_FRIENDLY_LIVE_GAMES: ReadonlySet<number> = new Set([294]);

/** true si el juego se puede jugar en celulares y tabletas. */
export function isMobileFriendly(kind: GameKind, id: number | string | undefined | null): boolean {
  return kind === "live" && MOBILE_FRIENDLY_LIVE_GAMES.has(Number(id));
}
