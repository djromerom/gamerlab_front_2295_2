import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchGameFile = vi.fn();
vi.mock("@/features/games/api/gameFrame", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/features/games/api/gameFrame")>();
  return { ...real, fetchGameFile: (...args: unknown[]) => fetchGameFile(...args) };
});

import { GameFileError } from "@/features/games/api/gameFrame";
import { useGameLoader } from "@/features/games/hooks/useGameLoader";

type Reply = (msg: { type: string; gameId: string; entry: string }) => { type: string; gameId: string; message?: string } | null;

/** navigator.serviceWorker de mentira: el SW contesta LOAD_ZIP con lo que diga `reply`. */
function fakeServiceWorker({ controlled = true, reply }: { controlled?: boolean; reply: Reply }) {
  const container = new EventTarget() as EventTarget & Record<string, unknown>;
  const posted: { type: string; [k: string]: unknown }[] = [];
  const worker = {
    postMessage: (msg: { type: string; gameId: string; entry: string }) => {
      posted.push(msg);
      if (msg.type === "CLAIM") {
        container.controller = worker;
        setTimeout(() => container.dispatchEvent(new Event("controllerchange")));
        return;
      }
      const answer = reply(msg);
      if (answer) setTimeout(() => container.dispatchEvent(new MessageEvent("message", { data: answer })));
    },
  };
  container.controller = controlled ? worker : null;
  container.register = vi.fn(async () => ({ active: worker }));
  container.ready = Promise.resolve({ active: worker });
  Object.defineProperty(navigator, "serviceWorker", { value: container, configurable: true });
  return { posted };
}

const zipResponse = () =>
  new Response(new Uint8Array([80, 75, 3, 4, 0, 0]), { status: 200, headers: { "Content-Length": "6" } });

beforeEach(() => {
  fetchGameFile.mockReset();
  fetchGameFile.mockResolvedValue({ name: "Ruta 66", teamName: "Byte Club", gameFileURL: "https://blob/juego.zip?sig=x", entry: "Build/index.html" });
  vi.stubGlobal("fetch", vi.fn(async () => zipResponse()));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useGameLoader", () => {
  it("un histórico queda listo con su clave y su entry", async () => {
    const { posted } = fakeServiceWorker({ reply: (m) => ({ type: "ZIP_READY", gameId: m.gameId }) });
    const { result } = renderHook(() => useGameLoader("historical", 87));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current).toMatchObject({ key: "historical-87", entry: "Build/index.html", name: "Ruta 66" });
    expect(fetchGameFile).toHaveBeenCalledWith("historical", 87);
    expect(posted[0]).toMatchObject({ type: "LOAD_ZIP", gameId: "historical-87", entry: "Build/index.html" });
  });

  it("F4: un zip dañado muestra el error del SW en vez de quedarse cargando", async () => {
    fakeServiceWorker({
      reply: (m) => ({ type: "ZIP_ERROR", gameId: m.gameId, message: "No se pudo abrir el archivo del juego: el .zip está dañado o no es un zip." }),
    });
    const { result } = renderHook(() => useGameLoader("live", 12));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ reason: "zip", message: expect.stringContaining("dañado") });
  });

  it("un juego sin zip lo dice", async () => {
    fakeServiceWorker({ reply: () => null });
    fetchGameFile.mockRejectedValueOnce(new GameFileError("noFile", "Este juego no tiene una versión para jugar."));
    const { result } = renderHook(() => useGameLoader("historical", 3));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ reason: "noFile", message: "Este juego no tiene una versión para jugar." });
  });

  it("si la descarga falla (URL vencida), avisa", async () => {
    fakeServiceWorker({ reply: () => null });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 403 })));
    const { result } = renderHook(() => useGameLoader("live", 12));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ reason: "download", message: expect.stringContaining("error 403") });
  });

  it("si el SW todavía no controla la página, se lo pide (CLAIM) sin recargar", async () => {
    const { posted } = fakeServiceWorker({ controlled: false, reply: (m) => ({ type: "ZIP_READY", gameId: m.gameId }) });
    const { result } = renderHook(() => useGameLoader("live", 12));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(posted.map((m) => m.type)).toEqual(["CLAIM", "LOAD_ZIP"]);
  });

  it("en el celular (enabled = false) no descarga nada", async () => {
    fakeServiceWorker({ reply: () => null });
    const { result } = renderHook(() => useGameLoader("live", 12, false));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.status).toBe("idle");
    expect(fetchGameFile).not.toHaveBeenCalled();
  });

  it("un id que no es número es «no encontrado»", async () => {
    fakeServiceWorker({ reply: () => null });
    const { result } = renderHook(() => useGameLoader("live", Number("abc")));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ reason: "notFound" });
  });

  it("BG-66: un juego que no existe lo dice aunque el service worker nunca quede listo", async () => {
    fakeServiceWorker({ reply: () => null });
    (navigator.serviceWorker as unknown as { ready: Promise<unknown> }).ready = new Promise(() => {});
    fetchGameFile.mockRejectedValueOnce(new GameFileError("notFound", "No encontramos este videojuego. Revisa el enlace."));
    const { result } = renderHook(() => useGameLoader("live", 99999));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ reason: "notFound" });
  });
});
