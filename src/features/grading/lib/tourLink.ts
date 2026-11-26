/**
 * Tour 360 externo que guía al jurado hasta el stand del equipo que tiene que calificar.
 * El tour devuelve al jurado a `url-dinamica` (la pantalla de calificación de ese juego), donde
 * se le pide el código de verificación del grupo (HU-19).
 */
export const TOUR_BASE_URL = "https://tours-360-coral.vercel.app/tour/v1125/ar";

interface TourGame {
  id: number;
  teamCode?: string;
}

/**
 * Enlace al tour para un juego. `url-dinamica` lleva la URL de vuelta completa (con el dominio
 * en el que corre ARKAD, así sirve igual en test y en producción) y `equipo` el código del equipo,
 * para que el tour sepa a qué stand llevar al jurado.
 */
export function buildTourUrl(
  game: TourGame,
  ratePath: string,
  origin: string = window.location.origin,
): string {
  const url = new URL(TOUR_BASE_URL);
  url.searchParams.set("url-dinamica", `${origin}${ratePath}/${game.id}`);
  if (game.teamCode) url.searchParams.set("equipo", game.teamCode);
  return url.toString();
}
