import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ContingencyError,
  acceptSubstituteSuggestions,
  fetchContingencySettings,
  fetchContingencySuggestions,
  rejectSubstituteSuggestion,
  updateContingencySettings,
} from "@/features/jurors/contingency/api/contingency";
import { AssignmentWarningsError } from "@/features/jurors/assignment/lib/assignmentWarnings";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const API = "http://api.test/juror/contingency";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Cliente de contingencia con suplentes (HU-14, ARK-213)", () => {
  afterEach(() => apiFetch.mockReset());

  it("pide la sugerencia con GET /juror/contingency/suggestions sin caché", async () => {
    apiFetch.mockResolvedValue(json(200, { grupos: [], totales: { gruposEnRiesgo: 0 } }));

    await expect(fetchContingencySuggestions()).resolves.toMatchObject({ grupos: [] });
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/suggestions`);
    expect(options.cache).toBe("no-store");
  });

  it("acepta con POST suggestions/accept enviando los pares y confirmWarnings", async () => {
    apiFetch.mockResolvedValue(json(200, { message: "Se agregaron 2 asignaciones", totales: { asignacionesAgregadas: 2 } }));
    const pairs = [{ teamId: 12, substituteId: "s1" }, { teamId: 13, substituteId: "s2" }];

    await acceptSubstituteSuggestions(pairs, true);
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/suggestions/accept`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ assignments: pairs, confirmWarnings: true });
  });

  it("un 409 ASSIGNMENT_WARNINGS al aceptar se convierte en advertencias para confirmar", async () => {
    apiFetch.mockResolvedValue(
      json(409, {
        code: "ASSIGNMENT_WARNINGS",
        message: "La asignación rompe reglas",
        warnings: [{ code: "JUROR_OVER_LIMIT", message: "Laura quedaría con 6 grupos", jurorId: "s1" }],
      }),
    );

    const error = await acceptSubstituteSuggestions([{ teamId: 12, substituteId: "s1" }]).catch((e) => e);
    expect(error).toBeInstanceOf(AssignmentWarningsError);
    expect(error.warnings[0].message).toBe("Laura quedaría con 6 grupos");
  });

  it("NOT_A_SUBSTITUTE muestra un mensaje claro y conserva el code", async () => {
    apiFetch.mockResolvedValue(json(400, { code: "NOT_A_SUBSTITUTE", message: "x" }));

    const error = await acceptSubstituteSuggestions([{ teamId: 12, substituteId: "o1" }]).catch((e) => e);
    expect(error).toBeInstanceOf(ContingencyError);
    expect(error).toMatchObject({ status: 400, code: "NOT_A_SUBSTITUTE" });
    expect(error.message).toMatch(/Suplente confirmado/);
  });

  it("los bloqueos de HU-08 muestran el mensaje del back", async () => {
    apiFetch.mockResolvedValue(json(400, { code: "SCHOOL_REQUIRES_SENIOR", message: "Laura es junior y el grupo es de colegios." }));

    const error = await acceptSubstituteSuggestions([{ teamId: 5, substituteId: "s1" }]).catch((e) => e);
    expect(error).toMatchObject({ code: "SCHOOL_REQUIRES_SENIOR", message: "Laura es junior y el grupo es de colegios." });
  });

  it("los bloqueos conservan el jurorId y el teamId que manda el back", async () => {
    apiFetch.mockResolvedValue(
      json(400, { code: "MISSING_JUROR_CATEGORY", message: "El jurado no tiene categoría asignada (JUNIOR/SENIOR).", jurorId: "s1", teamId: 5 }),
    );

    const error = await acceptSubstituteSuggestions([{ teamId: 5, substituteId: "s1" }]).catch((e) => e);
    expect(error).toMatchObject({ code: "MISSING_JUROR_CATEGORY", jurorId: "s1", teamId: 5 });
  });

  it("un 500 no expone el error interno", async () => {
    apiFetch.mockResolvedValue(json(500, { message: "PrismaClientKnownRequestError" }));

    const error = await acceptSubstituteSuggestions([{ teamId: 5, substituteId: "s1" }]).catch((e) => e);
    expect(error.message).toBe("No se pudo asignar a los suplentes. No cambió ninguna asignación.");
  });

  it("rechaza con POST suggestions/reject y omite substituteIds vacíos y motivo en blanco", async () => {
    apiFetch.mockResolvedValue(json(200, { message: "Sugerencia rechazada" }));

    await rejectSubstituteSuggestion({ teamId: 12, substituteIds: [], reason: "   " });
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/suggestions/reject`);
    expect(JSON.parse(options.body)).toEqual({ teamId: 12 });
  });

  it("rechaza solo los suplentes elegidos con el motivo recortado", async () => {
    apiFetch.mockResolvedValue(json(200, { message: "ok" }));

    await rejectSubstituteSuggestion({ teamId: 12, substituteIds: ["s1"], reason: " Prefiero a un profesor " });
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ teamId: 12, substituteIds: ["s1"], reason: "Prefiero a un profesor" });
  });

  it("NO_SUGGESTION_TO_REJECT pide actualizar la vista", async () => {
    apiFetch.mockResolvedValue(json(400, { code: "NO_SUGGESTION_TO_REJECT", message: "x" }));

    const error = await rejectSubstituteSuggestion({ teamId: 12 }).catch((e) => e);
    expect(error.message).toMatch(/Actualiza la vista/);
  });

  it("lee y guarda el mínimo con GET y PUT /juror/contingency/settings", async () => {
    apiFetch.mockResolvedValueOnce(json(200, { minEvaluationsPerTeam: 3, cronograma: null }));
    apiFetch.mockResolvedValueOnce(json(200, { minEvaluationsPerTeam: 4, cronograma: null }));

    await expect(fetchContingencySettings()).resolves.toMatchObject({ minEvaluationsPerTeam: 3 });
    await expect(updateContingencySettings(4)).resolves.toMatchObject({ minEvaluationsPerTeam: 4 });
    const [url, options] = apiFetch.mock.calls[1];
    expect(url).toBe(`${API}/settings`);
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ minEvaluationsPerTeam: 4 });
  });

  it("EVENT_CONFIGURATION_NOT_FOUND al guardar explica qué hacer", async () => {
    apiFetch.mockResolvedValue(json(404, { code: "EVENT_CONFIGURATION_NOT_FOUND", message: "x" }));

    const error = await updateContingencySettings(4).catch((e) => e);
    expect(error).toMatchObject({ status: 404, code: "EVENT_CONFIGURATION_NOT_FOUND" });
    expect(error.message).toMatch(/Ediciones/);
  });
});
