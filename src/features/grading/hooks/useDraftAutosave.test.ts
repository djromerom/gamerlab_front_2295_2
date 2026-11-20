import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadInitialDraft, loadInitialDrafts } from "@/features/grading/hooks/useDraftAutosave";
import { apiFetch } from "@/lib/api";
import { backupKey, type ServerDraft } from "@/lib/evaluationDrafts";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

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
