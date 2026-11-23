import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadInitialDraft, loadInitialDrafts, useDraftAutosave } from "@/features/grading/hooks/useDraftAutosave";
import { apiFetch } from "@/lib/api";
import { backupKey, readBackup, type ServerDraft } from "@/lib/evaluationDrafts";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { warning: vi.fn() } }));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const remote = (videogameId: number, patch: Partial<ServerDraft> = {}): ServerDraft => ({
  videogameId,
  videogameName: "Juego",
  teamId: 1,
  teamName: "Equipo",
  teamCode: "N10-ABC-1",
  details: [{ criterionId: 1, score: 4 }],
  comments: "del servidor",
  version: 3,
  createdAt: "2026-11-08T02:00:00.000Z",
  updatedAt: "2026-11-08T02:15:00.000Z",
  status: "PENDING",
  ...patch,
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.mocked(apiFetch).mockReset());

describe("loadInitialDraft", () => {
  it("reanuda el borrador del servidor y descarta la copia local más vieja", async () => {
    localStorage.setItem(
      backupKey(300),
      JSON.stringify({ scores: { 1: "1" }, comments: "viejo", savedAt: Date.parse("2026-11-08T01:00:00Z") }),
    );
    vi.mocked(apiFetch).mockResolvedValue(json(200, { draft: remote(300) }));

    const loaded = await loadInitialDraft(300);

    expect(loaded).toMatchObject({ source: "server", version: 3, needsSync: false });
    expect(loaded.form?.comments).toBe("del servidor");
    expect(localStorage.getItem(backupKey(300))).toBeNull();
  });

  it("sin red usa la copia local para no perder lo escrito", async () => {
    localStorage.setItem(backupKey(300), JSON.stringify({ scores: { 1: "2" }, comments: "local", savedAt: 5 }));
    vi.mocked(apiFetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const loaded = await loadInitialDraft(300);

    expect(loaded).toMatchObject({ source: "local", version: 0, needsSync: true });
    expect(loaded.form?.comments).toBe("local");
  });

  it("sin borrador en ningún lado, empieza vacío", async () => {
    vi.mocked(apiFetch).mockResolvedValue(json(200, { draft: null }));
    expect(await loadInitialDraft(300)).toMatchObject({ source: "none", form: null, version: 0 });
  });
});

describe("loadInitialDrafts", () => {
  it("trae los borradores del lote con una sola petición", async () => {
    vi.mocked(apiFetch).mockResolvedValue(json(200, [remote(1, { version: 2 }), remote(9)]));

    const loaded = await loadInitialDrafts([1, 2]);

    expect(vi.mocked(apiFetch)).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(apiFetch).mock.calls[0][0])).toBe("http://api.test/evaluation/drafts");
    expect(loaded.get(1)).toMatchObject({ source: "server", version: 2 });
    expect(loaded.get(2)).toMatchObject({ source: "none", version: 0 });
  });
});

describe("useDraftAutosave · sin llegada registrada en la mesa (BG-71, ARK-286)", () => {
  const notCheckedIn = () =>
    json(409, {
      statusCode: 409,
      code: "JUROR_NOT_CHECKED_IN",
      message: "Registra tu llegada en la mesa de ARKAD para poder calificar.",
    });
  const empty = { version: 0, form: null, needsSync: false };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast.warning).mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("avisa una sola vez aunque fallen varios juegos del lote y varios reintentos, y no pierde lo escrito", async () => {
    vi.mocked(apiFetch).mockImplementation(async () => notCheckedIn());
    const { result, unmount } = renderHook(() => useDraftAutosave());

    act(() => {
      result.current.start(1, empty);
      result.current.start(2, empty);
    });
    act(() => {
      result.current.schedule(1, { scores: { 1: "4" }, comments: "Juego uno" });
      result.current.schedule(2, { scores: { 1: "3" }, comments: "Juego dos" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500 + 15000 * 2);
    });

    expect(vi.mocked(apiFetch).mock.calls.length).toBe(6); // 2 juegos × (guardado + 2 reintentos)
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(
      "Registra tu llegada en la mesa de ARKAD para poder calificar.",
      expect.objectContaining({ id: "juror-not-checked-in" }),
    );
    expect(result.current.stateOf(1).status).toBe("not-checked-in");
    expect(result.current.stateOf(2).status).toBe("not-checked-in");
    expect(readBackup(1)?.comments).toBe("Juego uno");
    expect(readBackup(2)?.comments).toBe("Juego dos");
    unmount();
  });

  it("vuelve a avisar si, después de guardar, otra vez falta la llegada (la anularon)", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(notCheckedIn())
      .mockResolvedValueOnce(json(200, remote(1, { version: 1 })))
      .mockResolvedValue(notCheckedIn());
    const { result, unmount } = renderHook(() => useDraftAutosave());

    act(() => result.current.start(1, empty));
    act(() => result.current.schedule(1, { scores: { 1: "4" }, comments: "" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(toast.warning).toHaveBeenCalledTimes(1);

    // Registraron la llegada: el reintento guarda.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    expect(result.current.stateOf(1).status).toBe("saved");

    // Anularon la llegada: el siguiente cambio vuelve a avisar.
    act(() => result.current.schedule(1, { scores: { 1: "5" }, comments: "" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(toast.warning).toHaveBeenCalledTimes(2);
    unmount();
  });
});
