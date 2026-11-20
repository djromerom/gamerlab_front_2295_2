import { apiFetch } from "@/lib/api";
import type { MinigameGame } from "@/features/public/lib/minigameRecords";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";
/** Si el back no contesta en este tiempo, el juego sigue solo con el récord local */
const TIMEOUT_MS = 8000;

/** Una fila del top: puesto, alias y puntaje (Arkad Jam dice su canción en track; Arkadash trae «global») */
export interface MinigameRecordRow {
  /** Solo llega cuando consulta el Administrador (con su sesión): sirve para borrar el récord */
  id?: number;
  position: number;
  alias: string;
  score: number;
  track: string;
  createdAt: string;
}

export interface MinigameTop {
  game: MinigameGame;
  /** null: top de todas las canciones de Arkad Jam */
  track: string | null;
  /** De 0 a 5 filas, de mayor a menor puntaje; el récord global es top[0] */
  top: MinigameRecordRow[];
}

export interface SavedMinigameRecord extends MinigameTop {
  /** false: no superó el top (no es un error) */
  saved: boolean;
  position: number | null;
}

export interface MinigameRecordInput {
  game: MinigameGame;
  /** Solo Arkad Jam: `<instrumento>-<índice>` */
  track?: string;
  alias: string;
  score: number;
}

/**
 * Respuesta de error del back: status HTTP, el code (MINIGAME_ALIAS_INVALID, MINIGAME_ALIAS_OFFENSIVE…) y el mensaje
 * del back (serverMessage), que en MINIGAME_ALIAS_OFFENSIVE es el que se muestra.
 */
export class MinigameRecordError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly serverMessage?: string;
  constructor(status: number, code?: string, serverMessage?: string) {
    super(`No se pudo usar el récord global (error ${status}${code ? `, ${code}` : ""}).`);
    this.name = "MinigameRecordError";
    this.status = status;
    this.code = code;
    this.serverMessage = serverMessage;
  }
}

/** apiFetch o el de useFetch (con la sesión, para borrar) */
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function pedir(url: string, opciones: RequestInit = {}, fetcher: Fetcher = apiFetch): Promise<unknown> {
  const control = new AbortController();
  const limite = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const res = await fetcher(url, { ...opciones, signal: control.signal });
    const datos: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const { code, message } = (datos ?? {}) as { code?: unknown; message?: unknown };
      throw new MinigameRecordError(
        res.status,
        typeof code === "string" ? code : undefined,
        typeof message === "string" ? message : undefined,
      );
    }
    if (!Array.isArray((datos as { top?: unknown } | null)?.top)) throw new MinigameRecordError(res.status, "RESPUESTA_INVALIDA");
    return datos;
  } finally {
    clearTimeout(limite);
  }
}

/**
 * GET /minigame-records (público, HU-52): top 5 de Arkadash, de una canción de Arkad Jam o, sin track, de todas las
 * canciones de Arkad Jam. Contrato: ARK-315.
 */
export async function fetchMinigameTop(game: MinigameGame, track?: string): Promise<MinigameTop> {
  const consulta = new URLSearchParams({ game });
  if (track) consulta.set("track", track);
  return (await pedir(`${API_URL}/minigame-records?${consulta}`)) as MinigameTop;
}

/** POST /minigame-records: guarda el puntaje solo si entra al top 5 (si no, saved: false y el top actual) */
export async function saveMinigameRecord(input: MinigameRecordInput): Promise<SavedMinigameRecord> {
  const cuerpo: MinigameRecordInput = { game: input.game, alias: input.alias, score: input.score };
  if (input.track) cuerpo.track = input.track;
  return (await pedir(`${API_URL}/minigame-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  })) as SavedMinigameRecord;
}

/**
 * DELETE /minigame-records/:id (solo el Administrador): quita un alias grosero o un puntaje falso de la pantalla
 * principal. Devuelve el top de ese juego o canción ya sin él. 404 MINIGAME_RECORD_NOT_FOUND si ya se borró.
 * Necesita la sesión: se le pasa el fetch de useFetch.
 */
export async function deleteMinigameRecord(id: number, fetcher: Fetcher): Promise<MinigameTop> {
  return (await pedir(`${API_URL}/minigame-records/${id}`, { method: "DELETE" }, fetcher)) as MinigameTop;
}
