import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import {
  backupKey,
  clearAllBackups,
  DraftRequestError,
  formatSavedAgo,
  pickInitialDraft,
  readBackup,
  saveDraft,
  toDraftScore,
  toSaveBody,
  writeBackup,
  type ServerDraft,
} from "@/lib/evaluationDrafts";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const serverDraft = (patch: Partial<ServerDraft> = {}): ServerDraft => ({
  videogameId: 300,
  videogameName: "Juego Gamma",
  teamId: 300,
  teamName: "Equipo Gamma",
  teamCode: "N10-ABC-1003",
  details: [{ criterionId: 1, score: 4.5 }],
  comments: "Buen arte",
  version: 2,
  createdAt: "2026-11-08T02:00:00.000Z",
  updatedAt: "2026-11-08T02:15:00.000Z",
  status: "PENDING",
  ...patch,
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.mocked(apiFetch).mockReset());

describe("toDraftScore / toSaveBody", () => {
  it("convierte las notas escritas a números de 0 a 5 con 2 decimales y omite las vacías", () => {
    expect(toDraftScore("4,5")).toBe(4.5);
    expect(toDraftScore("4.567")).toBe(4.57);
    expect(toDraftScore("7")).toBe(5);
    expect(toDraftScore("4.")).toBe(4);
    expect(toDraftScore("")).toBeNull();
    expect(toDraftScore(".")).toBeNull();

    const body = toSaveBody({ scores: { 1: "4.5", 2: "", 3: "3" }, comments: "ok" }, 7);
    expect(body).toEqual({
      version: 7,
      details: [
        { criterionId: 1, score: 4.5 },
        { criterionId: 3, score: 3 },
      ],
      comments: "ok",
    });
  });

  it("recorta el comentario al máximo que acepta el servidor", () => {
    const body = toSaveBody({ scores: {}, comments: "x".repeat(6000) }, 0);
    expect(body.comments).toHaveLength(5000);
  });
});

describe("pickInitialDraft", () => {
  it("usa el borrador del servidor cuando no hay nada local", () => {
    const initial = pickInitialDraft(serverDraft(), null);
    expect(initial).toMatchObject({ source: "server", version: 2, needsSync: false });
    expect(initial.form).toEqual({ scores: { 1: "4.5" }, comments: "Buen arte" });
  });

  it("prefiere lo local si se escribió después del último guardado del servidor (sin red)", () => {
    const local = { scores: { 1: "2" }, comments: "offline", savedAt: Date.parse("2026-11-08T03:00:00Z") };
    const initial = pickInitialDraft(serverDraft(), local);
    expect(initial).toMatchObject({ source: "local", version: 2, needsSync: true });
    expect(initial.form?.comments).toBe("offline");
  });

  it("el servidor manda si su versión es más nueva que la copia local", () => {
    const local = { scores: { 1: "2" }, comments: "vieja", savedAt: Date.parse("2026-11-08T01:00:00Z") };
    expect(pickInitialDraft(serverDraft(), local).source).toBe("server");
  });

  it("sin borrador en el servidor, sube lo local con versión 0", () => {
    const local = { scores: { 1: "2" }, comments: "", savedAt: 1 };
    expect(pickInitialDraft(null, local)).toMatchObject({ source: "local", version: 0, needsSync: true });
    expect(pickInitialDraft(null, null)).toMatchObject({ source: "none", form: null, version: 0 });
  });
});

describe("respaldo local", () => {
  it("lee las claves antiguas de RatePage, BatchRatePage y SchoolRate", () => {
    localStorage.setItem("rate-draft-1", JSON.stringify({ scores: { 5: "4" }, comments: "a" }));
    localStorage.setItem(
      "batch-rate-draft-2",
      JSON.stringify({ scores: { comments: "b", details: [{ criterionId: 5, score: "3" }] } }),
    );
    localStorage.setItem(
      "school-rate-draft-3",
      JSON.stringify({ criteria: [{ id: 5, score: "2" }, { id: 6, score: "" }], comments: "c" }),
    );

    expect(readBackup(1)).toEqual({ scores: { 5: "4" }, comments: "a", savedAt: 0 });
    expect(readBackup(2)).toEqual({ scores: { 5: "3" }, comments: "b", savedAt: 0 });
    expect(readBackup(3)).toEqual({ scores: { 5: "2" }, comments: "c", savedAt: 0 });
  });

  it("al cerrar sesión borra todos los borradores locales y deja lo demás", () => {
    writeBackup(10, { scores: { 1: "4" }, comments: "" });
    localStorage.setItem("rate-draft-11", "{}");
    localStorage.setItem("theme", "dark");

    clearAllBackups();

    expect(localStorage.getItem(backupKey(10))).toBeNull();
    expect(localStorage.getItem("rate-draft-11")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});

describe("saveDraft", () => {
  it("manda PUT con la versión y devuelve el borrador guardado", async () => {
    vi.mocked(apiFetch).mockResolvedValue(json(200, serverDraft({ version: 3 })));

    const saved = await saveDraft(300, { version: 2, details: [], comments: "" });

    expect(saved.version).toBe(3);
    const [url, init] = vi.mocked(apiFetch).mock.calls[0];
    expect(url).toBe("http://api.test/evaluation/drafts/300");
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({ version: 2, details: [], comments: "" });
  });

  it("clasifica los errores del servidor", async () => {
    const remote = serverDraft({ version: 5 });
    const cases: [Response, string][] = [
      [json(409, { code: "DRAFT_VERSION_CONFLICT", message: "cambió", draft: remote }), "conflict"],
      [json(409, { code: "EVALUATION_ALREADY_SUBMITTED", message: "ya", evaluationId: 9 }), "submitted"],
      [json(403, { message: "Este grupo no está asignado al evaluador" }), "forbidden"],
      [json(400, { message: ["score must be a number"] }), "invalid"],
      [json(503, {}), "network"],
    ];
    for (const [response, kind] of cases) {
      vi.mocked(apiFetch).mockResolvedValueOnce(response);
      const error = await saveDraft(300, { version: 1, details: [], comments: "" }).catch((e) => e);
      expect(error).toBeInstanceOf(DraftRequestError);
      expect((error as DraftRequestError).kind).toBe(kind);
      if (kind === "conflict") expect((error as DraftRequestError).draft?.version).toBe(5);
    }
  });

  it("sin red lanza un error de tipo network", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await saveDraft(300, { version: 0, details: [], comments: "" }).catch((e) => e);
    expect((error as DraftRequestError).kind).toBe("network");
  });
});

describe("formatSavedAgo", () => {
  it("describe hace cuánto se guardó", () => {
    const now = Date.parse("2026-11-08T12:00:00Z");
    expect(formatSavedAgo("2026-11-08T11:59:30Z", now)).toBe("hace un momento");
    expect(formatSavedAgo("2026-11-08T11:55:00Z", now)).toBe("hace 5 min");
    expect(formatSavedAgo("2026-11-08T09:00:00Z", now)).toBe("hace 3 h");
    expect(formatSavedAgo("2026-11-07T10:00:00Z", now)).toBe("hace 1 día");
    expect(formatSavedAgo(null, now)).toBe("");
  });
});
