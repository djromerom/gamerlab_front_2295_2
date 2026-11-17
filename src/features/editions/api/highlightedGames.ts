import { apiFetch } from "@/lib/api";
import { extractErrorMessage, type HighlightedGameRow } from "@/api/editions";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/** Videojuego histórico de una edición archivada (GET /historicals/historical-videogames/:editionId). */
export interface HistoricalVideogame {
  /** historicalVideogameId: es el que se envía al destacarlo */
  id: number;
  name: string;
  logoUrl?: string | null;
  /** Si viene con valor, el juego tiene zip y se puede jugar en la web */
  gameFileUrl?: string | null;
}

/**
 * Juegos históricos de una edición archivada (ARK-230). El back responde 404 cuando la edición no tiene
 * volcado histórico o no tiene juegos: se toma como lista vacía.
 */
export async function fetchHistoricalVideogames(editionId: number): Promise<HistoricalVideogame[]> {
  const res = await apiFetch(`${API_URL}/historicals/historical-videogames/${editionId}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const datos: unknown = await res.json();
  return Array.isArray(datos) ? (datos as HistoricalVideogame[]) : [];
}

/** Destaca un juego histórico en su edición (POST con historicalVideogameId, permiso ManageHighlightedGames). */
export async function addHistoricalHighlightedGame(
  editionId: number,
  historicalVideogameId: number,
): Promise<HighlightedGameRow> {
  const res = await apiFetch(`${API_URL}/editions/${editionId}/highlighted-games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ historicalVideogameId }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

/** Quita el destacado de un juego histórico (DELETE …/highlighted-games/historical/:historicalVideogameId). */
export async function removeHistoricalHighlightedGame(
  editionId: number,
  historicalVideogameId: number,
): Promise<void> {
  const res = await apiFetch(
    `${API_URL}/editions/${editionId}/highlighted-games/historical/${historicalVideogameId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(await extractErrorMessage(res));
}
