import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/** Edición de un destacado. semester: 10 = primer semestre, 20 = intersemestral, 30 = segundo semestre */
export interface HighlightedEdition {
  id: number;
  year: number;
  semester: number;
  title: string;
}

/**
 * Juego destacado por el admin (HU-41, ARK-228), de cualquier edición.
 * play.type «live» se juega con /play-game/:id; «historical» es un juego de una edición archivada (se juega con HU-40).
 */
export interface StudentHighlightedGame {
  id: number;
  name: string;
  teamName: string;
  edition: HighlightedEdition;
  logoUrl: string | null;
  /** true si el juego tiene zip (se puede jugar en la web) */
  hasGameFile: boolean;
  /** TA-36 (ARK-326): el admin lo marcó como jugable en celular. Un back anterior no lo envía (= false). */
  allowMobile?: boolean;
  play: { type: "live" | "historical"; id: number };
}

/**
 * GET /highlighted-games (público, sin sesión). Sin editionId devuelve los destacados de todas las ediciones,
 * de la más reciente a la más antigua y por nombre. Contrato: ARK-229.
 */
export async function fetchHighlightedGames(editionId?: number): Promise<StudentHighlightedGame[]> {
  const consulta = editionId === undefined ? "" : `?editionId=${editionId}`;
  const res = await apiFetch(`${API_URL}/highlighted-games${consulta}`);
  if (!res.ok) throw new Error(`No se pudieron cargar los juegos destacados (error ${res.status}).`);
  const datos: unknown = await res.json();
  return Array.isArray(datos) ? (datos as StudentHighlightedGame[]) : [];
}
