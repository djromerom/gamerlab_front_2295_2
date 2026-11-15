import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASSIGN_FAILED_MESSAGE,
  CREATE_FAILED_MESSAGE,
  WalkInJurorError,
  assignWalkInTeams,
  createWalkInJuror,
  fetchTeamSuggestion,
  resendJurorAccountEmail,
} from "@/features/jurors/attendance/api/walkInJurors";
import { AssignmentWarningsError } from "@/features/jurors/assignment/lib/assignmentWarnings";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const API = "http://api.test";
const BODY = { firstName: "Laura", lastName: "Gómez Ruiz", email: "laura.gomez@ejemplo.com" };
const PERSON = {
  id: "d4e5",
  name: "Laura Gómez Ruiz",
  role: "Jurado",
  isActive: true,
  isJurorOfEdition: true,
  editionStatus: "CONFIRMED",
  checkedInAt: null,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Cliente del jurado del día (HU-24, ARK-217)", () => {
  afterEach(() => apiFetch.mockReset());

  it("da de alta con POST /walk-in-jurors y solo manda nombre, apellido y correo", async () => {
    apiFetch.mockResolvedValue(json(201, { juror: { id: "a1", category: "JUNIOR", type: "BACKUP" }, walkIn: true }));

    await expect(createWalkInJuror(BODY)).resolves.toMatchObject({ juror: { id: "a1", type: "BACKUP" } });
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/walk-in-jurors`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(BODY);
  });

  it("el 409 EMAIL_ALREADY_EXISTS trae a la persona que ya existe", async () => {
    apiFetch.mockResolvedValue(
      json(409, { statusCode: 409, code: "EMAIL_ALREADY_EXISTS", message: "Ese correo ya es de Laura", existing: PERSON }),
    );

    const error = await createWalkInJuror(BODY).catch((e) => e);
    expect(error).toBeInstanceOf(WalkInJurorError);
    expect(error).toMatchObject({ status: 409, code: "EMAIL_ALREADY_EXISTS", message: "Ese correo ya es de Laura" });
    expect(error.details.existing).toEqual(PERSON);
  });

  it("el 409 SIMILAR_PEOPLE trae las coincidencias y se repite con confirmSimilar", async () => {
    apiFetch.mockResolvedValueOnce(
      json(409, { statusCode: 409, code: "SIMILAR_PEOPLE", message: "Ya hay una persona parecida", matches: [PERSON, { bad: true }] }),
    );
    const error = await createWalkInJuror(BODY).catch((e) => e);
    expect(error.code).toBe("SIMILAR_PEOPLE");
    expect(error.details.matches).toEqual([PERSON]);

    apiFetch.mockResolvedValueOnce(json(201, { juror: { id: "a1" } }));
    await createWalkInJuror({ ...BODY, confirmSimilar: true });
    expect(JSON.parse(apiFetch.mock.calls[1][1].body)).toEqual({ ...BODY, confirmSimilar: true });
  });

  it("un 400 conserva la lista de textos del back para repartirla por campo", async () => {
    apiFetch.mockResolvedValue(json(400, { statusCode: 400, message: ["El nombre es obligatorio", "El correo electrónico no es válido"] }));

    const error = await createWalkInJuror(BODY).catch((e) => e);
    expect(error.status).toBe(400);
    expect(error.details.messages).toEqual(["El nombre es obligatorio", "El correo electrónico no es válido"]);
  });

  it("403, 404 sin edición activa y 500 muestran textos fijos", async () => {
    apiFetch.mockResolvedValueOnce(json(403, { message: "Forbidden" }));
    expect((await createWalkInJuror(BODY).catch((e) => e)).message).toMatch(/solo el administrador/);

    apiFetch.mockResolvedValueOnce(json(404, { code: "NO_ACTIVE_EDITION", message: "No active edition" }));
    expect((await createWalkInJuror(BODY).catch((e) => e)).message).toBe("No hay una edición activa.");

    apiFetch.mockResolvedValueOnce(new Response("boom", { status: 500 }));
    expect((await createWalkInJuror(BODY).catch((e) => e)).message).toBe(CREATE_FAILED_MESSAGE);
  });

  it("pide la propuesta con GET y el tope de 3 grupos por defecto", async () => {
    apiFetch.mockResolvedValue(json(200, { level: 2, teams: [], otherTeamsOfLevel: [], reason: null }));

    await fetchTeamSuggestion("a 1");
    expect(apiFetch.mock.calls[0][0]).toBe(`${API}/walk-in-jurors/a%201/team-suggestion?maxTeams=3`);
  });

  it("un 404 NOT_A_JUNIOR_SUBSTITUTE en la propuesta se explica", async () => {
    apiFetch.mockResolvedValue(json(404, { code: "NOT_A_JUNIOR_SUBSTITUTE", message: "Not found" }));

    const error = await fetchTeamSuggestion("a1").catch((e) => e);
    expect(error.message).toMatch(/no es Suplente Junior/);
  });

  it("asigna con POST .../assignments y confirmWarnings", async () => {
    apiFetch.mockResolvedValue(json(200, { message: "Se asignaron 3 grupos", equiposAgregados: [] }));

    await assignWalkInTeams("a1", [12, 15, 18], true);
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/walk-in-jurors/a1/assignments`);
    expect(JSON.parse(options.body)).toEqual({ teamIds: [12, 15, 18], confirmWarnings: true });
  });

  it("un 409 ASSIGNMENT_WARNINGS se convierte en advertencias para confirmar", async () => {
    apiFetch.mockResolvedValue(
      json(409, {
        code: "ASSIGNMENT_WARNINGS",
        message: "Rompe reglas",
        warnings: [{ code: "JUROR_MIXED_LEVELS", message: "Laura quedaría con grupos de dos niveles" }],
      }),
    );

    const error = await assignWalkInTeams("a1", [12]).catch((e) => e);
    expect(error).toBeInstanceOf(AssignmentWarningsError);
    expect(error.warnings[0].code).toBe("JUROR_MIXED_LEVELS");
  });

  it("los bloqueos de HU-08 (colegios) muestran el mensaje del back con su code", async () => {
    apiFetch.mockResolvedValue(json(400, { code: "SCHOOL_REQUIRES_SENIOR", message: "Laura es junior y el grupo N0-COL-02 es de colegios." }));

    const error = await assignWalkInTeams("a1", [5]).catch((e) => e);
    expect(error).toMatchObject({ status: 400, code: "SCHOOL_REQUIRES_SENIOR" });
    expect(error.message).toMatch(/colegios/);
  });

  it("un 500 al asignar dice que no cambió nada", async () => {
    apiFetch.mockResolvedValue(json(500, { message: "Internal server error" }));
    expect((await assignWalkInTeams("a1", [5]).catch((e) => e)).message).toBe(ASSIGN_FAILED_MESSAGE);
  });

  it("reenvía el correo con la ruta que ya existe", async () => {
    apiFetch.mockResolvedValue(json(201, {}));

    await resendJurorAccountEmail("laura@ejemplo.com");
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe(`${API}/juror/resend-confirmation`);
    expect(JSON.parse(options.body)).toEqual({ email: "laura@ejemplo.com" });
  });
});
