import { useEffect, useState } from "react";
import { fetchGameFile, GameFileError, type GameFileErrorReason } from "@/features/games/api/gameFrame";
import { gameKey, type GameKind } from "@/features/games/lib/gameFiles";

export type GameLoaderErrorReason = GameFileErrorReason | "unsupported" | "download" | "zip";

export type GameLoaderState =
  | { status: "idle" }
  | { status: "loading"; phase: "file" | "download" | "unzip"; progress: number | null }
  | { status: "ready"; key: string; entry: string; name: string; teamName: string }
  | { status: "error"; reason: GameLoaderErrorReason; message: string };

class LoaderError extends Error {
  constructor(
    readonly reason: GameLoaderErrorReason,
    message: string,
  ) {
    super(message);
  }
}

/** Cuánto se espera a que el SW tome el control de la página y a que descomprima el zip. */
export const CONTROLLER_TIMEOUT_MS = 5_000;
export const UNZIP_TIMEOUT_MS = 180_000;

/** Descarga el zip y avisa el porcentaje cuando el servidor dice el tamaño (Content-Length). */
async function downloadZip(url: string, signal: AbortSignal, onProgress: (p: number | null) => void): Promise<ArrayBuffer> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new LoaderError("download", "Se cortó la descarga del juego. Revisa tu conexión e inténtalo de nuevo.");
  }
  if (!res.ok) {
    throw new LoaderError("download", `No se pudo descargar el juego (error ${res.status}). Recarga la página.`);
  }
  const total = Number(res.headers.get("Content-Length")) || 0;
  if (!res.body || !total) {
    onProgress(null);
    return res.arrayBuffer();
  }
  // Se copia en un búfer del tamaño final: con zips de hasta 200 MB no se guarda el juego dos veces en memoria
  const reader = res.body.getReader();
  let buffer = new Uint8Array(total);
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (received + value.byteLength > buffer.byteLength) {
      // el servidor dijo un tamaño menor al real: se agranda
      const bigger = new Uint8Array(Math.max(buffer.byteLength * 2, received + value.byteLength));
      bigger.set(buffer.subarray(0, received));
      buffer = bigger;
    }
    buffer.set(value, received);
    received += value.byteLength;
    onProgress(Math.min(100, Math.round((received / total) * 100)));
  }
  return received === buffer.byteLength ? buffer.buffer : buffer.slice(0, received).buffer;
}

/** El SW recién instalado todavía no controla la página: se le pide que la tome (CLAIM) y se espera. */
async function waitForController(registration: ServiceWorkerRegistration): Promise<ServiceWorker> {
  const sw = navigator.serviceWorker;
  if (sw.controller) return sw.controller;
  const taken = new Promise<ServiceWorker | null>((resolve) => {
    const timer = setTimeout(() => resolve(sw.controller), CONTROLLER_TIMEOUT_MS);
    sw.addEventListener(
      "controllerchange",
      () => {
        clearTimeout(timer);
        resolve(sw.controller);
      },
      { once: true },
    );
  });
  (registration.active ?? registration.waiting ?? registration.installing)?.postMessage({ type: "CLAIM" });
  const controller = await taken;
  if (!controller) {
    throw new LoaderError("unsupported", "No se pudo preparar el reproductor. Recarga la página (sin Ctrl/Shift).");
  }
  return controller;
}

/** `serviceWorker.ready` no tiene tiempo límite: si el SW no se activa, se avisa en vez de esperar para siempre. */
async function waitForReady(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new LoaderError("unsupported", "No se pudo preparar el reproductor. Recarga la página (sin Ctrl/Shift).")),
      CONTROLLER_TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([navigator.serviceWorker.ready, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Manda el zip al SW y espera ZIP_READY o ZIP_ERROR (F4). */
function unzipInWorker(controller: ServiceWorker, key: string, entry: string, zip: ArrayBuffer, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const sw = navigator.serviceWorker;
    const done = () => {
      clearTimeout(timer);
      sw.removeEventListener("message", onMessage);
      signal.removeEventListener("abort", onAbort);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data?.gameId !== key) return;
      if (e.data.type === "ZIP_READY") {
        done();
        resolve();
      } else if (e.data.type === "ZIP_ERROR") {
        done();
        reject(new LoaderError("zip", e.data.message || "No se pudo abrir el archivo del juego."));
      }
    };
    const onAbort = () => {
      done();
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      done();
      reject(new LoaderError("zip", "El juego tardó demasiado en abrir. Recarga la página e inténtalo de nuevo."));
    }, UNZIP_TIMEOUT_MS);
    sw.addEventListener("message", onMessage);
    signal.addEventListener("abort", onAbort);
    controller.postMessage({ type: "LOAD_ZIP", zipBuffer: zip, gameId: key, entry }, [zip]);
  });
}

/**
 * HU-40 (ARK-225): prepara un juego para el iframe de /play-game. Pide su archivo al back, descarga el zip y lo
 * entrega al service worker (src/sw.ts), que lo descomprime y sirve sus archivos en /play-game/<clave>/…
 * Con enabled = false (celular) no descarga nada.
 */
export function useGameLoader(kind: GameKind, id: number, enabled = true): GameLoaderState {
  const [state, setState] = useState<GameLoaderState>({ status: "idle" });

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle" });
      return;
    }
    const abort = new AbortController();
    const { signal } = abort;
    const set = (next: GameLoaderState) => {
      if (!signal.aborted) setState(next);
    };

    const load = async () => {
      set({ status: "loading", phase: "file", progress: null });
      if (!Number.isInteger(id) || id <= 0) {
        throw new GameFileError("notFound", "No encontramos este videojuego. Revisa el enlace.");
      }
      // BG-66 (ARK-266): primero se pregunta por el juego. Antes se esperaba al service worker y, si este no
      // quedaba listo, un juego que no existe se quedaba cargando para siempre.
      const file = await fetchGameFile(kind, id);
      if (!("serviceWorker" in navigator)) {
        throw new LoaderError(
          "unsupported",
          "Este navegador no puede abrir los juegos. Usa Chrome, Edge o Firefox en un computador.",
        );
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await waitForReady();

      set({ status: "loading", phase: "download", progress: 0 });
      const zip = await downloadZip(file.gameFileURL, signal, (progress) =>
        set({ status: "loading", phase: "download", progress }),
      );

      set({ status: "loading", phase: "unzip", progress: null });
      const controller = await waitForController(registration);
      const key = gameKey(kind, id);
      const entry = file.entry || "index.html";
      await unzipInWorker(controller, key, entry, zip, signal);
      set({ status: "ready", key, entry, name: file.name, teamName: file.teamName });
    };

    load().catch((e: unknown) => {
      if (signal.aborted) return;
      if (e instanceof GameFileError || e instanceof LoaderError) {
        set({ status: "error", reason: e.reason, message: e.message });
      } else {
        console.error("No se pudo cargar el juego:", e);
        set({ status: "error", reason: "failed", message: "No se pudo cargar el juego. Recarga la página e inténtalo de nuevo." });
      }
    });

    return () => abort.abort();
  }, [kind, id, enabled]);

  return state;
}
