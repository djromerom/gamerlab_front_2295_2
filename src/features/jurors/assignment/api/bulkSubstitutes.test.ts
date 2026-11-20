import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BulkSubstituteError,
  SAVE_FAILED_MESSAGE,
  assignSubstitutesInBulk,
  fetchEditionEvaluators,
} from "@/features/jurors/assignment/api/bulkSubstitutes";
import { AssignmentWarningsError } from "@/features/jurors/assignment/lib/assignmentWarnings";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const API = "http://api.test";
const BODY = { jurorIds: ["j1"], substituteIds: ["s1"] };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Cliente de suplentes en lote (HU-09, ARK-215)", () => {
  afterEach(() => apiFetch.mockReset());

  it("asigna con POST /juror/assignments/substitutes/bulk y devuelve el resumen", async () => {
    apiFetch.mockResolvedValue(json(200, { message: "Se agregaron 3 asignaciones", totales: { asignacionesAgregadas: 3 } }));

    await expect(assignSubstitutesInBulk({ ...BODY, confirmWarnings: true })).resolves.toMatchObject({ message: "Se agregaron 3 asignaciones" });
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/juror/assignments/substitutes/bulk`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ ...BODY, confirmWarnings: true });
  });

  it("un 409 ASSIGNMENT_WARNINGS se convierte en advertencias para confirmar", async () => {
    apiFetch.mockResolvedValue(
      json(409, {
        statusCode: 409,
        code: "ASSIGNMENT_WARNINGS",
        message: "La asignación rompe reglas",
        warnings: [{ code: "JUROR_OVER_LIMIT", message: "Laura quedaría con 6 grupos", jurorId: "s1" }],
      }),
    );

    const error = await assignSubstitutesInBulk(BODY).catch((e) => e);
    expect(error).toBeInstanceOf(AssignmentWarningsError);
    expect(error.warnings).toEqual([{ code: "JUROR_OVER_LIMIT", message: "Laura quedaría con 6 grupos", jurorId: "s1" }]);
  });

  it("los bloqueos de HU-08 muestran el mensaje del back y conservan el code", async () => {
    apiFetch.mockResolvedValue(
      json(400, { code: "SCHOOL_REQUIRES_SENIOR", message: "Laura es junior y el grupo N0-COL-02 es de colegios.", teamId: 5, jurorId: "s1" }),
    );

    const error = await assignSubstitutesInBulk(BODY).catch((e) => e);
    expect(error).toBeInstanceOf(BulkSubstituteError);
    expect(error).toMatchObject({ status: 400, code: "SCHOOL_REQUIRES_SENIOR" });
    expect(error.message).toMatch(/colegios/);
  });

  it("los códigos conocidos se explican con un mensaje propio", async () => {
    apiFetch.mockResolvedValue(json(400, { code: "NOT_A_SUBSTITUTE", message: "Not a substitute", ids: ["s1"] }));

    await expect(assignSubstitutesInBulk(BODY)).rejects.toThrow(/Suplente confirmado de la edición/);
  });

  it("une la lista de errores de validación", async () => {
    apiFetch.mockResolvedValue(json(400, { message: ["jurorIds must contain at least 1 elements", "x"] }));

    await expect(assignSubstitutesInBulk(BODY)).rejects.toThrow("jurorIds must contain at least 1 elements, x");
  });

  it("un 500 dice que no cambió ninguna asignación", async () => {
    apiFetch.mockResolvedValue(json(500, { message: "Internal server error" }));

    await expect(assignSubstitutesInBulk(BODY)).rejects.toThrow(SAVE_FAILED_MESSAGE);
  });

  it("carga los jurados de la edición recorriendo las páginas y suma sus grupos", async () => {
    apiFetch
      .mockResolvedValueOnce(
        json(200, {
          data: [{ id: "j1", firstName: "Ana", lastName: "Pérez", email: "a@x.co", jurorType: "OFFICIAL", jurorCategory: "SENIOR", isProfessor: false, evaluatedCount: 1, unevaluatedCount: 2 }],
          metadata: { totalPages: 2 },
        }),
      )
      .mockResolvedValueOnce(
        json(200, {
          data: [{ id: "s1", firstName: "Laura", lastName: "Gómez", email: "l@x.co", jurorType: "BACKUP", jurorCategory: "JUNIOR", isProfessor: false }],
          metadata: { totalPages: 2 },
        }),
      );

    const evaluators = await fetchEditionEvaluators();

    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/juror?includeInactive=false&participating=true&limit=100&page=1`);
    expect(apiFetch.mock.calls[1][0]).toContain("page=2");
    expect(evaluators.map((e) => [e.id, e.assignedTeams, e.jurorType])).toEqual([
      ["j1", 3, "OFFICIAL"],
      ["s1", 0, "BACKUP"],
    ]);
  });
});
