import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalkInJurorDialog } from "@/features/jurors/attendance/components/WalkInJurorDialog";
import {
  WalkInJurorError,
  type ExistingPerson,
  type SuggestedTeam,
  type TeamSuggestion,
  type WalkInJurorCreated,
} from "@/features/jurors/attendance/api/walkInJurors";
import { AssignmentWarningsError } from "@/features/jurors/assignment/lib/assignmentWarnings";

const createWalkInJuror = vi.fn();
const fetchTeamSuggestion = vi.fn();
const assignWalkInTeams = vi.fn();
const resendJurorAccountEmail = vi.fn();
const checkInJurorManually = vi.fn();

vi.mock("@/features/jurors/attendance/api/walkInJurors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/attendance/api/walkInJurors")>()),
  createWalkInJuror: (...args: unknown[]) => createWalkInJuror(...args),
  fetchTeamSuggestion: (...args: unknown[]) => fetchTeamSuggestion(...args),
  assignWalkInTeams: (...args: unknown[]) => assignWalkInTeams(...args),
  resendJurorAccountEmail: (...args: unknown[]) => resendJurorAccountEmail(...args),
}));
vi.mock("@/features/jurors/attendance/api/jurorCheckIn", () => ({
  checkInJurorManually: (...args: unknown[]) => checkInJurorManually(...args),
}));

const CREATED: WalkInJurorCreated = {
  juror: { id: "w1", name: "Laura Gómez Ruiz", email: "laura@ejemplo.com", category: "JUNIOR", type: "BACKUP" },
  edition: { id: 5, title: "ARKAD 2026-30" },
  attendance: { checkedInAt: "2026-11-26T14:12:05.000Z", method: "MANUAL" },
  walkIn: true,
};

const person = (extra: Partial<ExistingPerson> = {}): ExistingPerson => ({
  id: "p1",
  name: "Laura María Gómez Ruiz",
  role: "Jurado",
  isActive: true,
  isJurorOfEdition: true,
  editionStatus: "CONFIRMED",
  checkedInAt: null,
  ...extra,
});

const team = (id: number, faltantes: number): SuggestedTeam => ({
  id,
  codigo: `N2-ABC-${id}`,
  nombre: `Equipo ${id}`,
  videojuego: null,
  juradosContados: 3 - faltantes,
  faltantes,
});

const SUGGESTION: TeamSuggestion = {
  edition: { id: 5, title: "ARKAD 2026-30" },
  phase: "BEFORE_ALERT",
  basis: "ASSIGNED",
  maxTeams: 3,
  level: 2,
  levelLabel: "Nivel 2",
  teams: [team(12, 3), team(15, 2), team(18, 1)],
  otherTeamsOfLevel: [team(21, 1)],
  levels: [{ level: 2, faltantes: 7, gruposConFaltantes: 4 }],
  reason: null,
};

const renderDialog = () => {
  const onChanged = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <MemoryRouter>
      <WalkInJurorDialog open onOpenChange={onOpenChange} onChanged={onChanged} />
    </MemoryRouter>,
  );
  return { onChanged, onOpenChange };
};

const fillForm = (first = "Laura", last = "Gómez Ruiz", email = "laura@ejemplo.com") => {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: first } });
  fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: last } });
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Crear y registrar llegada" }));
};

const createAndPropose = async () => {
  createWalkInJuror.mockResolvedValue(CREATED);
  fetchTeamSuggestion.mockResolvedValue(SUGGESTION);
  const handlers = renderDialog();
  fillForm();
  fireEvent.click(await screen.findByRole("button", { name: /Asignar grupos automáticamente/ }));
  await screen.findByRole("list", { name: "Grupos propuestos" });
  return handlers;
};

describe("Agregar jurado del día (HU-24, ARK-218)", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("pide solo nombre, apellido y correo; Junior · Suplente es texto fijo", () => {
    renderDialog();
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(screen.getByText("Junior · Suplente")).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("valida en el navegador y no llama al back con datos inválidos", () => {
    renderDialog();
    fillForm("", "R2D2", "malo");
    expect(screen.getByText("El nombre es obligatorio")).toBeTruthy();
    expect(screen.getByText("El apellido solo puede contener letras y espacios")).toBeTruthy();
    expect(screen.getByText("El correo electrónico no es válido")).toBeTruthy();
    expect(createWalkInJuror).not.toHaveBeenCalled();
  });

  it("alta nueva: crea, muestra la llegada en hora de Colombia y refresca la asistencia", async () => {
    createWalkInJuror.mockResolvedValue(CREATED);
    const { onChanged } = renderDialog();
    fillForm();

    expect(await screen.findByText("Laura Gómez Ruiz")).toBeTruthy();
    expect(createWalkInJuror).toHaveBeenCalledWith({ firstName: "Laura", lastName: "Gómez Ruiz", email: "laura@ejemplo.com" });
    expect(screen.getByText(/Llegada a las 9:12/)).toBeTruthy();
    expect(screen.getByText("Alta del día")).toBeTruthy();
    expect(onChanged).toHaveBeenCalled();
  });

  it("reenvía el correo para crear la cuenta", async () => {
    createWalkInJuror.mockResolvedValue(CREATED);
    resendJurorAccountEmail.mockResolvedValue(undefined);
    renderDialog();
    fillForm();

    fireEvent.click(await screen.findByRole("button", { name: "Reenviar correo" }));
    expect((await screen.findByRole<HTMLButtonElement>("button", { name: "Correo reenviado" })).disabled).toBe(true);
    expect(resendJurorAccountEmail).toHaveBeenCalledWith("laura@ejemplo.com");
  });

  it("correo repetido: no crea nada y ofrece marcar la llegada de ese jurado", async () => {
    createWalkInJuror.mockRejectedValue(
      new WalkInJurorError("Ese correo ya es de Laura Gómez Ruiz (Jurado).", 409, "EMAIL_ALREADY_EXISTS", { existing: person({ name: "Laura Gómez Ruiz" }) }),
    );
    checkInJurorManually.mockResolvedValue({ status: "CHECKED_IN", checkedInAt: "2026-11-26T14:20:00.000Z" });
    const { onChanged } = renderDialog();
    fillForm();

    expect(await screen.findByText("Ese correo ya existe")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Marcar llegada" }));
    expect(await screen.findByText(/Llegada registrada a las 9:20/)).toBeTruthy();
    expect(checkInJurorManually).toHaveBeenCalledWith("p1");
    expect(onChanged).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /No es ninguno/ })).toBeNull();
  });

  it("nombre parecido: muestra las coincidencias y «No es ninguno, crear» repite con confirmSimilar", async () => {
    createWalkInJuror
      .mockRejectedValueOnce(new WalkInJurorError("Ya hay una persona con un nombre parecido", 409, "SIMILAR_PEOPLE", { matches: [person()] }))
      .mockResolvedValueOnce(CREATED);
    renderDialog();
    fillForm();

    const list = await screen.findByRole("list", { name: "Personas que ya existen" });
    expect(within(list).getByText("Laura María Gómez Ruiz")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "No es ninguno, crear" }));

    expect(await screen.findByText("Jurado agregado")).toBeTruthy();
    expect(createWalkInJuror).toHaveBeenLastCalledWith(expect.objectContaining({ confirmSimilar: true }));
  });

  it("profesor existente: no se crea como jurado y lleva a Jurados de la edición", async () => {
    createWalkInJuror.mockRejectedValue(
      new WalkInJurorError("Ya hay una persona parecida", 409, "SIMILAR_PEOPLE", {
        matches: [person({ role: "Profesor", isJurorOfEdition: false, editionStatus: null })],
      }),
    );
    renderDialog();
    fillForm();

    expect(await screen.findByText(/Si es esta persona, es profesor y no se crea como jurado/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir a Jurados de la edición" }).getAttribute("href")).toBe("/jurados-edicion");
    expect(screen.queryByRole("button", { name: "Marcar llegada" })).toBeNull();
  });

  it("correo de un profesor: no se crea y no ofrece crear de todos modos", async () => {
    createWalkInJuror.mockRejectedValue(
      new WalkInJurorError("Ese correo ya es de Mauricio Herrera (Profesor).", 409, "EMAIL_ALREADY_EXISTS", {
        existing: person({ name: "Mauricio Herrera", role: "Profesor", isJurorOfEdition: false, editionStatus: null }),
      }),
    );
    renderDialog();
    fillForm("Mauricio", "Herrera", "mauricio@uninorte.edu.co");

    expect(await screen.findByText(/Es profesor: no se crea como jurado/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /No es ninguno/ })).toBeNull();
  });

  it("un 400 del back se muestra junto a cada campo", async () => {
    createWalkInJuror.mockRejectedValue(
      new WalkInJurorError("x", 400, undefined, { messages: ["El correo electrónico no es válido"] }),
    );
    renderDialog();
    fillForm();

    expect(await screen.findByText("El correo electrónico no es válido")).toBeTruthy();
    expect(screen.getByLabelText("Correo").getAttribute("aria-invalid")).toBe("true");
  });

  it("propone los grupos del nivel con más faltantes y confirma sin editar", async () => {
    assignWalkInTeams.mockResolvedValue({
      message: "Se asignaron 3 grupos a Laura Gómez Ruiz. Nadie perdió grupos.",
      edicion: { id: 5, title: "ARKAD 2026-30" },
      jurado: { id: "w1", nombre: "Laura Gómez Ruiz" },
      equiposAgregados: [{ id: 12, codigo: "N2-ABC-12", nombre: "Equipo 12" }],
      equiposYaAsignados: [],
      advertenciasAceptadas: [],
    });
    const { onChanged } = await createAndPropose();

    expect(screen.getByText(/Nivel 2: el nivel con más jurados faltantes/)).toBeTruthy();
    expect(screen.getByText(/jurados asignados \(antes de las 11:00\)/)).toBeTruthy();
    const proposed = screen.getByRole("list", { name: "Grupos propuestos" });
    expect(within(proposed).getAllByRole("listitem")).toHaveLength(3);
    expect(within(proposed).queryByText(/Equipo 21/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Grupos asignados")).toBeTruthy();
    expect(assignWalkInTeams).toHaveBeenCalledWith("w1", [12, 15, 18], false);
    expect(screen.getByText(/recibe el aviso «Te asignaron grupos»/)).toBeTruthy();
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it("Editar deja quitar un grupo y cambiarlo por otro del mismo nivel", async () => {
    assignWalkInTeams.mockResolvedValue({ message: "ok", jurado: { id: "w1", nombre: "Laura" }, equiposAgregados: [], equiposYaAsignados: [], advertenciasAceptadas: [] });
    await createAndPropose();

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const options = screen.getByRole("list", { name: "Grupos con faltantes del nivel" });
    fireEvent.click(within(options).getByRole("checkbox", { name: "N2-ABC-18 Equipo 18" }));
    fireEvent.click(within(options).getByRole("checkbox", { name: "N2-ABC-21 Equipo 21" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(assignWalkInTeams).toHaveBeenCalledWith("w1", [12, 15, 21], false));
  });

  it("si no hay grupos con faltantes lo informa y no asigna nada", async () => {
    createWalkInJuror.mockResolvedValue(CREATED);
    fetchTeamSuggestion.mockResolvedValue({ ...SUGGESTION, level: null, levelLabel: null, teams: [], otherTeamsOfLevel: [], reason: "NO_SHORTAGE" });
    renderDialog();
    fillForm();
    fireEvent.click(await screen.findByRole("button", { name: /Asignar grupos automáticamente/ }));

    expect(await screen.findByText(/No hay grupos con faltantes/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
    expect(assignWalkInTeams).not.toHaveBeenCalled();
  });

  it("las advertencias de HU-08 se confirman y se repite con confirmWarnings", async () => {
    assignWalkInTeams
      .mockRejectedValueOnce(new AssignmentWarningsError("Rompe reglas", [{ code: "JUROR_OVER_LIMIT", message: "Laura quedaría con 6 grupos" }]))
      .mockResolvedValueOnce({ message: "ok", jurado: { id: "w1", nombre: "Laura" }, equiposAgregados: [], equiposYaAsignados: [], advertenciasAceptadas: [] });
    await createAndPropose();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Laura quedaría con 6 grupos")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(assignWalkInTeams).toHaveBeenLastCalledWith("w1", [12, 15, 18], true));
  });

  it("un bloqueo de HU-08 (grupo de colegios) se muestra y no cierra la propuesta", async () => {
    assignWalkInTeams.mockRejectedValue(new WalkInJurorError("Laura es junior y el grupo N0-COL-02 es de colegios.", 400, "SCHOOL_REQUIRES_SENIOR"));
    await createAndPropose();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/colegios/);
    expect(screen.getByRole("list", { name: "Grupos propuestos" })).toBeTruthy();
  });
});
