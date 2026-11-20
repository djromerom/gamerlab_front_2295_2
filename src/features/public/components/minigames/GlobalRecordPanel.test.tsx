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
const LLENO = [fila(1, "Pixel", 80), fila(2, "Nova", 60), fila(3, "Byte", 40), fila(4, "Luz", 30), fila(5, "Eco", 20)];

const terminar = (fin: MinigameFinish) => act(() => announceMinigameFinished(fin));
const campoAlias = () => screen.getByLabelText(/Entras al top 5 global/);

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
    expect(await screen.findByText("Pixel")).toBeTruthy();
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
    await screen.findByText("Pixel");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("en Arkad Jam pide el top de la canción y muestra el mejor personal", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKAD_JAM", track: "guitarra-3", top: [] });
    render(<GlobalRecordPanel game="ARKAD_JAM" />);
    terminar({ game: "ARKAD_JAM", track: "guitarra-3", score: 41250, best: 30000 });
    expect(await screen.findByText(/Aún no hay/)).toBeTruthy();
    expect(screen.getByText("TU MEJOR")).toBeTruthy();
    expect(screen.getByText("41.250")).toBeTruthy();
    expect(fetchMinigameTop).toHaveBeenCalledWith("ARKAD_JAM", "guitarra-3");
  });

  it("un alias de 2 caracteres o con 6 dígitos muestra el mensaje y no se envía", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 9 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "Pi" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("alert").textContent).toBe("El alias lleva de 3 a 12 letras o números.");
    fireEvent.change(campoAlias(), { target: { value: "Ana 200123" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("alert").textContent).toBe("No uses tu código, documento ni teléfono.");
    expect(saveMinigameRecord).not.toHaveBeenCalled();
  });

  it("al guardar muestra el puesto y el top que vuelve, y avisa a la franja de la landing", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: LLENO });
    saveMinigameRecord.mockResolvedValue({
      game: "ARKADASH", track: "global", saved: true, position: 2,
      top: [fila(1, "Pixel", 80), fila(2, "Yo Mismo", 70), fila(3, "Nova", 60), fila(4, "Byte", 40), fila(5, "Luz", 30)],
    });
    const guardado = vi.fn();
    window.addEventListener(MINIGAME_RECORD_SAVED_EVENT, guardado);
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 70 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "  Yo   Mismo " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("¡Quedaste en el puesto 2 del top global!")).toBeTruthy();
    expect(saveMinigameRecord).toHaveBeenCalledWith({ game: "ARKADASH", track: undefined, alias: "Yo Mismo", score: 70 });
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
    fireEvent.change(await waitFor(campoAlias), { target: { value: "Pixel" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/Alguien superó ese puntaje/)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("el mensaje del back sobre el alias se muestra junto al campo", async () => {
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    saveMinigameRecord.mockRejectedValue(new MinigameRecordError(400, "MINIGAME_ALIAS_PERSONAL_DATA"));
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 15 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "Pixel" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect((await screen.findByRole("alert")).textContent).toBe("No uses tu código, documento ni teléfono.");
    expect(campoAlias()).toBeTruthy();
  });

  it("un alias con una grosería muestra el mensaje del back y no se guarda", async () => {
    const delBack = "Elige otro alias: este no se puede mostrar en la pantalla principal";
    fetchMinigameTop.mockResolvedValue({ game: "ARKADASH", track: "global", top: [] });
    saveMinigameRecord.mockRejectedValueOnce(new MinigameRecordError(400, "MINIGAME_ALIAS_OFFENSIVE", delBack));
    render(<GlobalRecordPanel game="ARKADASH" />);
    terminar({ game: "ARKADASH", score: 15 });
    fireEvent.change(await waitFor(campoAlias), { target: { value: "p.u.t.a" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect((await screen.findByRole("alert")).textContent).toBe(delBack);
    expect(campoAlias()).toBeTruthy();

    // sin mensaje del back, el del front
    saveMinigameRecord.mockRejectedValueOnce(new MinigameRecordError(400, "MINIGAME_ALIAS_OFFENSIVE"));
    fireEvent.change(campoAlias(), { target: { value: "Mi3rda" } });
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
    fireEvent.change(await waitFor(campoAlias), { target: { value: "Pixel" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/Tu récord en este equipo sigue guardado/)).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
