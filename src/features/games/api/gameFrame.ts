import { apiFetch } from "@/lib/api";
import { reachableBlobUrl } from "@/features/teams/lib/azureFile";
import type { GameKind } from "@/features/games/lib/gameFiles";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/** Archivo jugable de un juego: la URL firmada del zip (vence en 1 h, no se guarda) y el archivo que lo abre. */
export interface GameFile {
  name: string;
  teamName: string;
  gameFileURL: string;
  entry: string;
  /** TA-36 (ARK-326): el admin marcó el juego como jugable en celular (trae controles táctiles). */
  allowMobile: boolean;
}

/** Por qué no se puede abrir un juego: no existe, no tiene zip o falló la consulta. */
export type GameFileErrorReason = "notFound" | "noFile" | "failed";

export class GameFileError extends Error {
  constructor(
    readonly reason: GameFileErrorReason,
    message: string,
  ) {
    super(message);
    this.name = "GameFileError";
  }
}

/**
 * HU-40 (ARK-225): pide el archivo jugable de un juego. Los dos endpoints son públicos y tienen la misma forma:
 * - en vivo: GET /videogames/:id
 * - histórico: GET /historicals/videogames/:historicalVideogameId/game-file (ARK-226)
 * Si el juego no tiene zip, el back responde 200 con gameFileURL vacío.
 */
export async function fetchGameFile(kind: GameKind, id: number): Promise<GameFile> {
  const url =
    kind === "historical"
      ? `${API_URL}/historicals/videogames/${id}/game-file`
      : `${API_URL}/videogames/${id}`;

  let res: Response;
  try {
    res = await apiFetch(url, { method: "GET", credentials: "include" });
  } catch {
    throw new GameFileError("failed", "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  }
  if (res.status === 404 || res.status === 400) {
    throw new GameFileError("notFound", "No encontramos este videojuego. Revisa el enlace.");
  }
  if (!res.ok) {
    throw new GameFileError("failed", `No se pudo cargar el videojuego (error ${res.status}).`);
  }

  const data = (await res.json()) as Partial<GameFile>;
  const gameFileURL = reachableBlobUrl(data.gameFileURL ?? "");
  if (!gameFileURL) {
    throw new GameFileError("noFile", "Este juego no tiene una versión para jugar.");
  }
  return {
    name: data.name ?? "",
    teamName: data.teamName ?? "",
    gameFileURL,
    entry: data.entry ?? "",
    allowMobile: data.allowMobile === true,
  };
}
