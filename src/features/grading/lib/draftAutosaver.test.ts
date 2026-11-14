import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DraftAutosaver, type AutosaveState } from "@/features/grading/lib/draftAutosaver";
import {
  backupKey,
  DraftRequestError,
  type SaveDraftBody,
  type ServerDraft,
} from "@/lib/evaluationDrafts";

const ID = 300;

const saved = (version: number, patch: Partial<ServerDraft> = {}): ServerDraft => ({
  videogameId: ID,
  videogameName: "Juego Gamma",
  teamId: 1,
  teamName: "Equipo",
  teamCode: "N10-ABC-1",
  details: [],
  comments: "",
  version,
  createdAt: "2026-11-08T02:00:00.000Z",
  updatedAt: "2026-11-08T02:15:00.000Z",
  status: "PENDING",
  ...patch,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(version = 0) {
  const save = vi.fn<(id: number, body: SaveDraftBody) => Promise<ServerDraft>>();
  const states: AutosaveState[] = [];
  const saver = new DraftAutosaver({
    videogameId: ID,
    version,
    delayMs: 2500,
    retryMs: 15000,
    save,
    onChange: (state) => states.push(state),
  });
  const last = () => states[states.length - 1];
  return { save, saver, last };
}

const form = (score: string, comments = "") => ({ scores: { 1: score }, comments });

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe("DraftAutosaver", () => {
  it("espera a que el jurado deje de escribir y manda solo el último estado completo", async () => {
    const { save, saver, last } = setup(0);
    save.mockResolvedValue(saved(1));

    saver.schedule(form("4"));
    await vi.advanceTimersByTimeAsync(1000);
    saver.schedule(form("4.5", "Buen arte"));
    await vi.advanceTimersByTimeAsync(2499);
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(ID, {
      version: 0,
      details: [{ criterionId: 1, score: 4.5 }],
      comments: "Buen arte",
    });
    expect(last().status).toBe("saved");
    expect(saver.currentVersion).toBe(1);
    // sincronizado: no queda copia local
    expect(localStorage.getItem(backupKey(ID))).toBeNull();
  });

  it("manda una sola petición a la vez y la siguiente al terminar, con la versión nueva", async () => {
    const { save, saver } = setup(1);
    const first = deferred<ServerDraft>();
    save.mockReturnValueOnce(first.promise).mockResolvedValueOnce(saved(3));

    saver.schedule(form("1"));
    await vi.advanceTimersByTimeAsync(2500);
    expect(save).toHaveBeenCalledTimes(1);

    saver.schedule(form("2"));
    await vi.advanceTimersByTimeAsync(2500);
    expect(save).toHaveBeenCalledTimes(1); // la primera sigue en vuelo

    first.resolve(saved(2));
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][1]).toMatchObject({ version: 2, details: [{ criterionId: 1, score: 2 }] });
    await vi.advanceTimersByTimeAsync(0);
    expect(saver.currentVersion).toBe(3);
  });

  it("sin red conserva el borrador en este dispositivo y reintenta", async () => {
    const { save, saver, last } = setup(0);
    save.mockRejectedValueOnce(new DraftRequestError("network", "Sin conexión")).mockResolvedValueOnce(saved(1));

    saver.schedule(form("3"));
    await vi.advanceTimersByTimeAsync(2500);
    expect(last().status).toBe("offline");
    expect(JSON.parse(localStorage.getItem(backupKey(ID))!)).toMatchObject({ scores: { 1: "3" } });

    await vi.advanceTimersByTimeAsync(15000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(last().status).toBe("saved");
    expect(localStorage.getItem(backupKey(ID))).toBeNull();
  });

  it("reintenta apenas vuelve la red", async () => {
    const { save, saver } = setup(0);
    save.mockRejectedValueOnce(new DraftRequestError("network", "Sin conexión")).mockResolvedValueOnce(saved(1));

    saver.schedule(form("3"));
    await vi.advanceTimersByTimeAsync(2500);
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("ante un 409 por versión se detiene y permite sobrescribir con la versión del servidor", async () => {
    const { save, saver, last } = setup(1);
    const remote = saved(4, { comments: "desde otra pestaña" });
    save
      .mockRejectedValueOnce(new DraftRequestError("conflict", "cambió", remote))
      .mockResolvedValueOnce(saved(5));

    saver.schedule(form("2", "mío"));
    await vi.advanceTimersByTimeAsync(2500);
    expect(last().status).toBe("conflict");
    expect(last().conflictDraft?.version).toBe(4);

    // mientras hay conflicto, los cambios no se mandan
    saver.schedule(form("2.5", "mío"));
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).toHaveBeenCalledTimes(1);

    saver.resolveConflict("overwrite");
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][1]).toMatchObject({ version: 4, comments: "mío" });
    expect(last().status).toBe("saved");
  });

  it("ante un 409 por versión permite cargar la versión guardada", async () => {
    const { save, saver, last } = setup(1);
    const remote = saved(4, { comments: "desde otra pestaña" });
    save.mockRejectedValueOnce(new DraftRequestError("conflict", "cambió", remote));

    saver.schedule(form("2"));
    await vi.advanceTimersByTimeAsync(2500);

    expect(saver.resolveConflict("load")).toBe(remote);
    expect(saver.currentVersion).toBe(4);
    expect(last().status).toBe("saved");
    expect(localStorage.getItem(backupKey(ID))).toBeNull();
  });

  it("si la evaluación ya se envió, deja de autoguardar y borra la copia local", async () => {
    const { save, saver, last } = setup(1);
    save.mockRejectedValueOnce(new DraftRequestError("submitted", "Ya enviaste la evaluación"));

    saver.schedule(form("2"));
    await vi.advanceTimersByTimeAsync(2500);
    expect(last()).toMatchObject({ status: "blocked", message: "Ya enviaste la evaluación" });
    expect(localStorage.getItem(backupKey(ID))).toBeNull();

    saver.schedule(form("3"));
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("con un 403 deja de autoguardar pero conserva lo escrito en local", async () => {
    const { save, saver, last } = setup(0);
    save.mockRejectedValueOnce(new DraftRequestError("forbidden", "Este grupo no está asignado al evaluador"));

    saver.schedule(form("2"));
    await vi.advanceTimersByTimeAsync(2500);
    expect(last().status).toBe("blocked");
    expect(localStorage.getItem(backupKey(ID))).not.toBeNull();
  });

  it("no crea un borrador vacío", async () => {
    const { save, saver, last } = setup(0);
    saver.schedule({ scores: { 1: "" }, comments: "  " });
    await vi.advanceTimersByTimeAsync(2500);
    expect(save).not.toHaveBeenCalled();
    expect(last().status).toBe("idle");
  });

  it("después de enviar la evaluación no vuelve a guardar", async () => {
    const { save, saver } = setup(2);
    saver.schedule(form("4"));
    saver.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).not.toHaveBeenCalled();
    expect(localStorage.getItem(backupKey(ID))).toBeNull();
  });

  it("al salir de la pantalla manda lo pendiente sin esperar", async () => {
    const { save, saver } = setup(2);
    save.mockResolvedValue(saved(3));
    saver.schedule(form("4"));
    saver.dispose();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
