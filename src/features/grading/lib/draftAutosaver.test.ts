import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DraftAutosaver, type AutosaveState } from "@/features/grading/lib/draftAutosaver";
import {
  backupKey,
  DraftRequestError,
  pickInitialDraft,
  readBackup,
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
  return { save, saver, last, states };
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

  it("después de un 403 sigue guardando en local lo que el jurado escribe, sin volver a llamar al servidor (ARK-249)", async () => {
    const { save, saver, last } = setup(3);
    save.mockRejectedValueOnce(new DraftRequestError("forbidden", "Este grupo no está asignado al evaluador"));

    const sixCriteria = (upTo: number) => ({
      scores: Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [id, id <= upTo ? String(id % 5) : ""])),
      comments: upTo === 6 ? "Terminado después del aviso" : "",
    });

    saver.schedule(sixCriteria(3));
    await vi.advanceTimersByTimeAsync(2500);
    expect(last().status).toBe("blocked");

    // Después del aviso «Conservamos lo escrito…» el jurado termina los otros 3 criterios.
    saver.schedule(sixCriteria(4));
    saver.schedule(sixCriteria(6));
    await vi.advanceTimersByTimeAsync(60000);

    expect(save).toHaveBeenCalledTimes(1);
    expect(last().status).toBe("blocked");
    const backup = readBackup(ID);
    expect(backup?.scores).toEqual(sixCriteria(6).scores);
    expect(backup?.comments).toBe("Terminado después del aviso");
    expect(backup?.baseVersion).toBe(3);

    // Al salir de la pantalla no se borra la copia ni se intenta guardar.
    saver.dispose();
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(readBackup(ID)?.scores).toEqual(sixCriteria(6).scores);

    // Cuando le devuelven el grupo, la copia local gana sobre el borrador viejo del servidor.
    const serverBefore = saved(3, { details: [1, 2, 3].map((id) => ({ criterionId: id, score: id % 5 })) });
    const initial = pickInitialDraft(serverBefore, readBackup(ID));
    expect(initial.source).toBe("local");
    expect(initial.form?.scores).toEqual(sixCriteria(6).scores);
    expect(initial.needsSync).toBe(true);
  });

  describe("sin llegada registrada en la mesa (BG-71, ARK-286)", () => {
    const notCheckedIn = () =>
      new DraftRequestError("not-checked-in", "Registra tu llegada en la mesa de ARKAD para poder calificar.");

    it("conserva lo escrito en local, muestra el aviso y guarda solo cuando registran la llegada", async () => {
      const { save, saver, last } = setup(0);
      save.mockRejectedValueOnce(notCheckedIn()).mockRejectedValueOnce(notCheckedIn()).mockResolvedValueOnce(saved(1));

      saver.schedule(form("4", "Buen arte"));
      await vi.advanceTimersByTimeAsync(2500);
      expect(last()).toMatchObject({
        status: "not-checked-in",
        message: "Registra tu llegada en la mesa de ARKAD para poder calificar.",
      });
      expect(readBackup(ID)).toMatchObject({ scores: { 1: "4" }, comments: "Buen arte", baseVersion: 0 });

      // Reintenta solo, sin que el jurado escriba: todavía no hay llegada.
      await vi.advanceTimersByTimeAsync(15000);
      expect(save).toHaveBeenCalledTimes(2);
      expect(last().status).toBe("not-checked-in");
      expect(readBackup(ID)).not.toBeNull();

      // La mesa registró la llegada: el siguiente reintento guarda y borra la copia local.
      await vi.advanceTimersByTimeAsync(15000);
      expect(save).toHaveBeenCalledTimes(3);
      expect(save.mock.calls[2][1]).toMatchObject({ version: 0, comments: "Buen arte" });
      expect(last()).toMatchObject({ status: "saved", message: null });
      expect(localStorage.getItem(backupKey(ID))).toBeNull();
    });

    it("lo que escribe después del aviso queda en local y sale con el siguiente guardado, sin pasar por «Guardando…»", async () => {
      const { save, saver, last, states } = setup(2);
      save.mockRejectedValueOnce(notCheckedIn()).mockRejectedValueOnce(notCheckedIn());

      saver.schedule(form("1"));
      await vi.advanceTimersByTimeAsync(2500);
      const warnedAt = states.length;

      saver.schedule(form("3", "Sigue escribiendo"));
      expect(readBackup(ID)).toMatchObject({ scores: { 1: "3" }, comments: "Sigue escribiendo", baseVersion: 2 });
      await vi.advanceTimersByTimeAsync(2500);

      expect(save).toHaveBeenCalledTimes(2);
      expect(save.mock.calls[1][1]).toMatchObject({ version: 2, comments: "Sigue escribiendo" });
      // El aviso no parpadea entre reintentos.
      expect(states.slice(warnedAt).map((state) => state.status)).not.toContain("saving");
      expect(states.slice(warnedAt).map((state) => state.status)).not.toContain("pending");
      expect(last().status).toBe("not-checked-in");
    });

    it("al salir de la pantalla no reintenta y la copia local queda para la próxima vez", async () => {
      const { save, saver } = setup(0);
      save.mockRejectedValue(notCheckedIn());

      saver.schedule(form("4"));
      await vi.advanceTimersByTimeAsync(2500);
      saver.dispose();
      await vi.advanceTimersByTimeAsync(60000);

      expect(save).toHaveBeenCalledTimes(2); // el del aviso y el de dispose; ningún reintento
      expect(readBackup(ID)?.scores).toEqual({ 1: "4" });
    });
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

/**
 * Lo escrito después del último guardado y que no llegó al servidor (sesión perdida, sin red) se
 * recupera al volver a abrir el formulario, sin importar si el reloj del navegador va atrasado o
 * adelantado respecto al del servidor.
 */
describe("respaldo local con el reloj del navegador desfasado", () => {
  const SERVER_NOW = Date.parse("2026-11-14T15:00:00.000Z");

  /** Guarda la versión 1 en el servidor y luego el siguiente cambio no llega (401). */
  async function loseLastChange(browserOffsetMs: number) {
    vi.setSystemTime(SERVER_NOW + browserOffsetMs);
    const { save, saver } = setup(0);
    const v1 = saved(1, {
      details: [{ criterionId: 1, score: 2 }],
      updatedAt: new Date(SERVER_NOW + 2500).toISOString(), // hora del servidor al guardar
    });
    save.mockResolvedValueOnce(v1);
    saver.schedule(form("2"));
    await vi.advanceTimersByTimeAsync(2500);
    expect(saver.currentVersion).toBe(1);

    // 2 s después del guardado escribe el comentario y se pierde la sesión.
    save.mockRejectedValue(new DraftRequestError("session", "Tu sesión venció"));
    await vi.advanceTimersByTimeAsync(2000);
    saver.schedule(form("2", "escrito antes de perder la sesión"));
    await vi.advanceTimersByTimeAsync(2500);
    saver.dispose();
    return v1;
  }

  it("lo escrito mientras viajaba un guardado queda sobre la versión nueva", async () => {
    const { save, saver } = setup(1);
    const first = deferred<ServerDraft>();
    save.mockReturnValueOnce(first.promise).mockRejectedValue(new DraftRequestError("network", "Sin conexión"));

    saver.schedule(form("1"));
    await vi.advanceTimersByTimeAsync(2500);
    saver.schedule(form("1", "mientras guardaba"));
    expect(readBackup(ID)?.baseVersion).toBe(1);

    first.resolve(saved(2));
    await vi.advanceTimersByTimeAsync(0);
    // el segundo guardado no llegó: el respaldo queda sobre la versión 2, la que tiene el servidor
    expect(readBackup(ID)).toMatchObject({ comments: "mientras guardaba", baseVersion: 2 });
    saver.dispose();
  });

  it("al sobrescribir tras un 409, el respaldo pasa a la versión del servidor", async () => {
    const { save, saver } = setup(1);
    save
      .mockRejectedValueOnce(new DraftRequestError("conflict", "cambió", saved(4)))
      .mockRejectedValue(new DraftRequestError("network", "Sin conexión"));
    saver.schedule(form("2", "mío"));
    await vi.advanceTimersByTimeAsync(2500);

    saver.resolveConflict("overwrite");
    await vi.advanceTimersByTimeAsync(0);
    expect(readBackup(ID)).toMatchObject({ comments: "mío", baseVersion: 4 });
    saver.dispose();
  });

  it.each([
    ["30 s atrasado", -30_000],
    ["5 min atrasado", -300_000],
    ["en hora", 0],
    ["1 min adelantado", 60_000],
  ])("con el navegador %s, al reabrir se recupera lo último escrito", async (_label, offset) => {
    const server = await loseLastChange(offset);
    const initial = pickInitialDraft(server, readBackup(ID));
    expect(initial).toMatchObject({
      source: "local",
      needsSync: true,
      version: 1,
      form: { comments: "escrito antes de perder la sesión" },
    });
  });
});
