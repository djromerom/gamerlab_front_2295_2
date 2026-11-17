// Lógica pura del reproductor de juegos (HU-40, ARK-225). La usan el service worker (src/sw.ts) y la app,
// así que no importa nada del DOM ni de React.

/** Juego de un equipo de la edición en curso (Videogame) o de una edición archivada (HistoricalVideogame). */
export type GameKind = "live" | "historical";

/**
 * Clave del juego en el service worker y en la ruta de sus archivos (/play-game/<clave>/<archivo>).
 * Los ids de Videogame y de HistoricalVideogame son secuencias distintas, así que los históricos llevan prefijo.
 * Los juegos en vivo conservan el id solo, como antes, para que un SW viejo todavía instalado los siga sirviendo.
 */
export function gameKey(kind: GameKind, id: number | string): string {
  return kind === "historical" ? `historical-${id}` : String(id);
}

/** Ruta de la página del juego en la app: /play-game/:id o /play-game/historical/:id. */
export function playPath(kind: GameKind, id: number | string): string {
  return kind === "historical" ? `/play-game/historical/${id}` : `/play-game/${id}`;
}

/** URL del archivo de entrada dentro del iframe, con cada tramo codificado (espacios, tildes). */
export function entryUrl(key: string, entry: string): string {
  return `/play-game/${key}/${entry.split("/").map(encodeURIComponent).join("/")}`;
}

const GAME_KEY = /^(?:\d+|historical-\d+)$/;

/**
 * Si la ruta pedida es un archivo de un juego, devuelve su clave y la ruta del archivo dentro del zip, ya
 * decodificada (F2: nombres con espacios o tildes). Las páginas de la app (/play-game/12, /play-game/historical/12)
 * no son archivos de juego.
 */
export function parseGameFileRequest(pathname: string): { key: string; filePath: string } | null {
  const match = pathname.match(/^\/play-game\/([^/]+)\/(.+)$/);
  if (!match || !GAME_KEY.test(match[1])) return null;
  let filePath = match[2];
  try {
    filePath = decodeURIComponent(filePath);
  } catch {
    // una secuencia % inválida: se busca tal cual
  }
  return { key: match[1], filePath };
}

// F3: tipos que piden los motores (Unity, Godot, pygbag) y los juegos HTML5.
const MIME_TYPES: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  js: "text/javascript",
  mjs: "text/javascript",
  css: "text/css",
  json: "application/json",
  wasm: "application/wasm",
  data: "application/octet-stream",
  pck: "application/octet-stream",
  apk: "application/octet-stream",
  txt: "text/plain",
  xml: "application/xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
};

/** Extensiones de compresión: Unity pide el tipo del archivo de adentro (game.wasm.gz → application/wasm). */
const COMPRESSED = new Set(["gz", "br", "unityweb"]);

export function mimeType(path: string): string {
  const name = path.split("/").pop() ?? "";
  const parts = name.toLowerCase().split(".");
  if (parts.length < 2) return "application/octet-stream";
  let ext = parts.pop()!;
  if (COMPRESSED.has(ext) && parts.length >= 2) ext = parts.pop()!;
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Unity entrega sus archivos .gz dentro de Build/ y espera que lleguen descomprimidos; el navegador no descomprime
 * lo que responde un service worker, así que lo hace el SW. pygbag, en cambio, quiere sus archivos tal cual.
 */
export function needsGunzip(filePath: string): boolean {
  return filePath.includes("Build/") && filePath.endsWith(".gz");
}

/** Cuántos juegos se guardan en Cache Storage (F5) antes de borrar los más viejos (F6). */
export const CACHED_GAMES = 2;
export const GAME_CACHE_PREFIX = "arkad-game-";
