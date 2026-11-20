import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import {
  MinigameRecordError,
  deleteMinigameRecord,
  fetchMinigameTop,
  saveMinigameRecord,
} from "@/features/public/api/minigameRecords";

const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });
const TOP = { game: "ARKAD_JAM", track: "guitarra-3", top: [{ position: 1, alias: "Pixel", score: 41250, track: "guitarra-3", createdAt: "2026-11-26T15:02:11.000Z" }] };

beforeEach(() => {
  apiFetch.mockReset();
});

describe("fetchMinigameTop", () => {
  it("Arkadash se pide sin canción", async () => {
    apiFetch.mockResolvedValue(respuesta({ game: "ARKADASH", track: "global", top: [] }));
    await expect(fetchMinigameTop("ARKADASH")).resolves.toMatchObject({ top: [] });
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/minigame-records?game=ARKADASH");
  });

  it("Arkad Jam se pide con la canción", async () => {
    apiFetch.mockResolvedValue(respuesta(TOP));
    const { top } = await fetchMinigameTop("ARKAD_JAM", "guitarra-3");
    expect(top[0].alias).toBe("Pixel");
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/minigame-records?game=ARKAD_JAM&track=guitarra-3");
  });

  it("un 429 o una respuesta sin top es un error", async () => {
    apiFetch.mockResolvedValueOnce(respuesta({ message: "Too Many Requests" }, 429));
    await expect(fetchMinigameTop("ARKADASH")).rejects.toMatchObject({ status: 429 });
    apiFetch.mockResolvedValueOnce(respuesta({ data: [] }));
    await expect(fetchMinigameTop("ARKADASH")).rejects.toBeInstanceOf(MinigameRecordError);
  });
});

describe("saveMinigameRecord", () => {
  it("envía juego, canción, alias y puntaje, y nada más", async () => {
    apiFetch.mockResolvedValue(respuesta({ ...TOP, saved: true, position: 1 }));
    const r = await saveMinigameRecord({ game: "ARKAD_JAM", track: "guitarra-3", alias: "Pixel", score: 41250 });
    expect(r).toMatchObject({ saved: true, position: 1 });
    const [url, opciones] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/minigame-records");
    expect(opciones.method).toBe("POST");
    expect(JSON.parse(opciones.body)).toEqual({ game: "ARKAD_JAM", alias: "Pixel", score: 41250, track: "guitarra-3" });
  });

  it("Arkadash no lleva track", async () => {
    apiFetch.mockResolvedValue(respuesta({ game: "ARKADASH", track: "global", top: [], saved: false, position: null }));
    await saveMinigameRecord({ game: "ARKADASH", alias: "Pixel", score: 12 });
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ game: "ARKADASH", alias: "Pixel", score: 12 });
  });

  it("un 400 trae el code y el mensaje del back", async () => {
    const mensaje = "Elige otro alias: este no se puede mostrar en la pantalla principal";
    apiFetch.mockResolvedValue(respuesta({ statusCode: 400, code: "MINIGAME_ALIAS_OFFENSIVE", message: mensaje }, 400));
    await expect(saveMinigameRecord({ game: "ARKADASH", alias: "p.u.t.a", score: 12 })).rejects.toMatchObject({
      status: 400,
      code: "MINIGAME_ALIAS_OFFENSIVE",
      serverMessage: mensaje,
    });
  });
});

describe("deleteMinigameRecord", () => {
  it("borra con el fetch de la sesión y devuelve el top sin el récord", async () => {
    const conSesion = vi.fn().mockResolvedValue(respuesta({ game: "ARKADASH", track: "global", top: [] }));
    await expect(deleteMinigameRecord(7, conSesion)).resolves.toMatchObject({ top: [] });
    expect(conSesion.mock.calls[0][0]).toBe("http://api.test/minigame-records/7");
    expect(conSesion.mock.calls[0][1].method).toBe("DELETE");
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("si ya se borró, el 404 trae MINIGAME_RECORD_NOT_FOUND", async () => {
    const conSesion = vi.fn().mockResolvedValue(respuesta({ statusCode: 404, code: "MINIGAME_RECORD_NOT_FOUND" }, 404));
    await expect(deleteMinigameRecord(7, conSesion)).rejects.toMatchObject({ status: 404, code: "MINIGAME_RECORD_NOT_FOUND" });
  });
});
