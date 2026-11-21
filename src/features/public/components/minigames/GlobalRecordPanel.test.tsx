import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MinigameRecordError, type MinigameRecordRow } from "@/features/public/api/minigameRecords";
import { MINIGAME_RECORD_SAVED_EVENT, announceMinigameFinished, type MinigameFinish } from "@/features/public/lib/minigameRecords";
import GlobalRecordPanel from "./GlobalRecordPanel";

const fetchMinigameTop = vi.fn();
const saveMinigameRecord = vi.fn();
vi.mock("@/features/public/api/minigameRecords", async (original) => ({
  ...(await original<typeof import("@/features/public/api/minigameRecords")>()),
  fetchMinigameTop: (...args: unknown[]) => fetchMinigameTop(...args),
  saveMinigameRecord: (...args: unknown[]) => saveMinigameRecord(...args),
}));

const fila = (position: number, alias: string, score: number, track = "global"): MinigameRecordRow => ({
  position, alias, score, track, createdAt: "2026-11-26T15:02:11.000Z",
});
// «PixelMaster» es de antes del cambio a 1-3 caracteres: se muestra tal cual
const LLENO = [fila(1, "PixelMaster", 80), fila(2, "NOV", 60), fila(3, "BYT", 40), fila(4, "LUZ", 30), fila(5, "ECO", 20)];

const terminar = (fin: MinigameFinish) => act(() => announceMinigameFinished(fin));
const campoAlias = () => screen.getByLabelText(/Entras al top 5/);

beforeEach(() => {
  fetchMinigameTop.mockReset();
  saveMinigameRecord.mockReset();
});
afterEach(cleanup);

describe("GlobalRecordPanel", () => {
  it("al terminar una partida muestra el récord global (top[0])", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: LLENO });
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 5 });
    expect(await screen.findByText("PixelMaster")).toBeTruthy();
    expect(screen.getByText("RÉCORD GLOBAL")).toBeTruthy();
    expect(fetchMinigameTop).toHaveBeenCalledWith("ARKADASH", undefined);
  });

  it("ignora el fin de partida del otro juego", () => {
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKAD_JAM", track: "piano-0", score: 500 });
    expect(fetchMinigameTop).not.toHaveBeenCalled();
  });

  it("con 5 récords, un puntaje que no supera al quinto no ofrece guardar", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: LLENO });
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 20 });
    await screen.findByText("PixelMaster");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("en Arkad Jam pide el top de la canción y muestra el mejor personal", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKAD_JAM", track: "guitarra-3", top: [] });
    render(<GlobalRecordPanel game="ARKAD_JAM" />);
    terminar({ game: "ARKAD_JAM", track: "guitarra-3", score: 41250, best: 30000 });
    expect(await screen.findByText("¡Sé el primero!")).toBeTruthy();
    expect(screen.getByText("TU MEJOR")).toBeTruthy();
    expect(screen.getByText("41.250")).toBeTruthy();
    expect(fetchMinigameTop).toHaveBeenCalledWith("ARKAD_JAM", "guitarra-3");
  });

  it("un alias vacío, de 4 caracteres, con un espacio o con un signo muestra el mensaje y no se envía", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 9 });
    const campo = await waitFor(campoAlias);
    expect(campo.getAttribute("maxLength")).toBe("3");
    for (const alias of ["", "   ", "ABCD", "A B", "A-1", "J.P"]) {
      fireEvent.change(campoAlias(), { target: { value: alias } });
      fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
      expect(screen.getByRole("alert").textContent).toBe("El alias lleva de 1 a 3 letras o números.");
    }
    expect(saveMinigameRecord).not.toHaveBeenCalled();
  });

  it("el alias se escribe en mayúsculas, como las iniciales de un arcade", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 9 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "ñu7" } });
    expect((campoAlias() as HTMLInputElement).value).toBe("ÑU7");
  });

  it("al guardar muestra el puesto y el top que vuelve, y avisa a la franja de la landing", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: LLENO });
    saveMinigameRecord.mockResolvedValue({
      game: "ARKADASH", track: "global", saved: true, position: 2,
      top: [fila(1, "PixelMaster", 80), fila(2, "YO", 70), fila(3, "NOV", 60), fila(4, "BYT", 40), fila(5, "LUZ", 30)],
    });
    const guardado = vi.fn();
    window.addEventListener(MINIGAME_RECORD_SAVED_EVENT, guardado);
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 70 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: " yo " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("¡Quedaste en el puesto 2 del top global!")).toBeTruthy();
    expect(saveMinigameRecord).toHaveBeenCalledWith({ game: "ARKADASH", track: undefined, alias: "YO", score: 70 });
    const filas = screen.getAllByRole("listitem");
    expect(filas).toHaveLength(5);
    expect(filas[1].getAttribute("aria-current")).toBe("true");
    expect(guardado).toHaveBeenCalledTimes(1);
    window.removeEventListener(MINIGAME_RECORD_SAVED_EVENT, guardado);
  });

  it("si otro superó el puntaje antes, lo dice y muestra el top sin puesto", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    saveMinigameRecord.mockResolvedValue({ game: "ARKADASH", track: "global", saved: false, position: null, top: LLENO });
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 15 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "PIX" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/Alguien superó ese puntaje/)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("si el back rechaza el alias, su mensaje se muestra junto al campo", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    saveMinigameRecord.mockRejectedValue(new MinigameRecordError(400, "MINIGAME_ALIAS_INVALID"));
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 15 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "PIX" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect((await screen.findByRole("alert")).textContent).toBe("El alias lleva de 1 a 3 letras o números.");
    expect(campoAlias()).toBeTruthy();
  });

  it("un alias con una grosería muestra el mensaje del back y no se guarda", async () => {
    const delBack = "Elige otro alias: este no se puede mostrar en la pantalla principal";
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    saveMinigameRecord.mockRejectedValueOnce(new MinigameRecordError(400, "MINIGAME_ALIAS_OFFENSIVE", delBack));
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 15 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "HPT" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect((await screen.findByRole("alert")).textContent).toBe(delBack);
    expect(campoAlias()).toBeTruthy();

    // sin mensaje del back, el del front
    saveMinigameRecord.mockRejectedValueOnce(new MinigameRecordError(400, "MINIGAME_ALIAS_OFFENSIVE"));
    fireEvent.change(campoAlias(), { target: { value: "P7A" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Elige otro alias: este no se puede mostrar en la pantalla principal."));
  });

  it("si el back no responde o da 429, no se muestra el top global", async () => {
    fetchMinigameTop.mockRejectedValue(new MinigameRecordError(429));
    const { container } = render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 15 });
    await waitFor(() => expect(container.querySelector(".record-global")?.hasAttribute("hidden")).toBe(true));
    expect(screen.queryByText("RÉCORD GLOBAL")).toBeNull();
  });

  it("si falla al guardar, avisa que el récord local sigue y no muestra el top", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: LLENO });
    saveMinigameRecord.mockRejectedValue(new MinigameRecordError(429));
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 90 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "PIX" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/Tu récord en este equipo sigue guardado/)).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
