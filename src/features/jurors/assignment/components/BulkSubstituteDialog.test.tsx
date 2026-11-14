import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BulkSubstituteDialog } from "@/features/jurors/assignment/components/BulkSubstituteDialog";
import {
  BulkSubstituteError,
  type BulkSubstituteAssignmentResult,
  type EditionEvaluator,
} from "@/features/jurors/assignment/api/bulkSubstitutes";
import { AssignmentWarningsError } from "@/features/jurors/assignment/lib/assignmentWarnings";

const fetchEditionEvaluators = vi.fn();
const assignSubstitutesInBulk = vi.fn();

vi.mock("@/features/jurors/assignment/api/bulkSubstitutes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/jurors/assignment/api/bulkSubstitutes")>()),
  fetchEditionEvaluators: (...args: unknown[]) => fetchEditionEvaluators(...args),
  assignSubstitutesInBulk: (...args: unknown[]) => assignSubstitutesInBulk(...args),
}));

const person = (id: string, firstName: string, extra: Partial<EditionEvaluator> = {}): EditionEvaluator => ({
  id,
  firstName,
  lastName: "Pérez",
  email: `${id}@x.co`,
  jurorType: "OFFICIAL",
  jurorCategory: "JUNIOR",
  isProfessor: false,
  assignedTeams: 0,
  ...extra,
});

const ANA = person("j1", "Ana", { assignedTeams: 3 });
const BETO = person("j2", "Beto", { assignedTeams: 2 });
const LAURA = person("s1", "Laura", { jurorType: "BACKUP" });
const DIEGO = person("s2", "Diego", { jurorType: "BACKUP", jurorCategory: "SENIOR", assignedTeams: 1 });

const RESULT: BulkSubstituteAssignmentResult = {
  message: "Se agregaron 3 asignaciones de suplentes en 3 grupos. Nadie perdió grupos.",
  edicion: { id: 3, title: "Feria" },
  suplentes: [
    {
      id: "s1",
      nombre: "Laura Pérez",
      equiposAgregados: [
        { id: 12, codigo: "N1-AYP-06", nombre: "Pixel Hunters" },
        { id: 15, codigo: "N1-AYP-09", nombre: "Code Knights" },
      ],
      equiposYaAsignados: [{ id: 18, codigo: "N1-AYP-11", nombre: "Byte Me" }],
    },
  ],
  juradosCubiertos: [{ id: "j1", nombre: "Ana Pérez", equiposCubiertos: 3 }],
  juradosSinGrupos: [],
  equiposNoAsignables: [{ id: 20, codigo: "N2-ABC-201", nombre: "Delta", motivo: "TEAM_NOT_GRADABLE" }],
  totales: { equiposCubiertos: 3, asignacionesAgregadas: 2, asignacionesOmitidas: 1 },
  advertenciasAceptadas: [],
};

const renderDialog = () => {
  const onAssigned = vi.fn();
  const onOpenChange = vi.fn();
  render(<BulkSubstituteDialog open onOpenChange={onOpenChange} onAssigned={onAssigned} />);
  return { onAssigned, onOpenChange };
};

const choose = async (list: string, name: string) => {
  const group = await screen.findByRole("list", { name: list });
  fireEvent.click(within(group).getByRole("checkbox", { name }));
};

describe("Cubrir jurados con suplentes (HU-09, ARK-216)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lista a cubrir solo jurados con grupos y como suplentes solo a los Suplente", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA, BETO, LAURA, DIEGO, person("j3", "Ceci")]);
    renderDialog();

    const covered = await screen.findByRole("list", { name: "Jurados a cubrir" });
    expect(within(covered).getByText("Ana Pérez")).toBeTruthy();
    expect(within(covered).getByText("Oficial · 3 grupos")).toBeTruthy();
    expect(within(covered).queryByText("Ceci Pérez")).toBeNull(); // sin grupos
    expect(within(covered).queryByText("Laura Pérez")).toBeNull();

    const subs = screen.getByRole("list", { name: "Suplentes" });
    expect(within(subs).getByText("Junior · sin grupos")).toBeTruthy();
    expect(within(subs).getByText("Senior · ya tiene 1 grupo")).toBeTruthy();
    expect(within(subs).queryByText("Ana Pérez")).toBeNull();
  });

  it("no deja asignar hasta elegir de las dos listas y muestra el resumen", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA, BETO, LAURA]);
    renderDialog();

    const assign = await screen.findByRole("button", { name: "Asignar suplentes" });
    expect(assign.hasAttribute("disabled")).toBe(true);
    await choose("Jurados a cubrir", "Ana Pérez");
    await choose("Jurados a cubrir", "Beto Pérez");
    expect(assign.hasAttribute("disabled")).toBe(true);
    await choose("Suplentes", "Laura Pérez");

    expect(assign.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("Se sumará 1 suplente a hasta 5 grupos de 2 jurados.")).toBeTruthy();
  });

  it("un suplente elegido como jurado a cubrir no se puede marcar como suplente", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA, DIEGO, LAURA]);
    renderDialog();

    await choose("Suplentes", "Diego Pérez");
    await choose("Jurados a cubrir", "Diego Pérez");

    const subs = screen.getByRole("list", { name: "Suplentes" });
    const diego = within(subs).getByRole("checkbox", { name: "Diego Pérez" }) as HTMLInputElement;
    expect(diego.disabled).toBe(true);
    expect(diego.checked).toBe(false);
    expect(within(subs).getByText("Está elegido como jurado a cubrir")).toBeTruthy();
  });

  it("guarda, muestra el resumen por suplente con las notas y refresca la pantalla", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA, LAURA]);
    assignSubstitutesInBulk.mockResolvedValue(RESULT);
    const { onAssigned, onOpenChange } = renderDialog();

    await choose("Jurados a cubrir", "Ana Pérez");
    await choose("Suplentes", "Laura Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Asignar suplentes" }));

    expect(await screen.findByText(RESULT.message)).toBeTruthy();
    expect(assignSubstitutesInBulk).toHaveBeenCalledWith({ jurorIds: ["j1"], substituteIds: ["s1"] });
    expect(screen.getByText("2 grupos nuevos · 1 ya los tenía")).toBeTruthy();
    expect(screen.getByText(/N1-AYP-06 Pixel Hunters · N1-AYP-09 Code Knights/)).toBeTruthy();
    expect(screen.getByText(/N2-ABC-201 Delta \(presentador externo, no se califica\)/)).toBeTruthy();
    expect(onAssigned).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("con advertencias de HU-08 pide confirmar y repite con confirmWarnings", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA, LAURA]);
    assignSubstitutesInBulk
      .mockRejectedValueOnce(
        new AssignmentWarningsError("Rompe reglas", [
          { code: "JUROR_OVER_LIMIT", message: "El jurado junior Laura Pérez quedaría con 6 grupos" },
        ]),
      )
      .mockResolvedValueOnce(RESULT);
    const { onAssigned } = renderDialog();

    await choose("Jurados a cubrir", "Ana Pérez");
    await choose("Suplentes", "Laura Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Asignar suplentes" }));

    const warning = await screen.findByRole("alertdialog");
    expect(within(warning).getByText("El jurado junior Laura Pérez quedaría con 6 grupos")).toBeTruthy();
    expect(onAssigned).not.toHaveBeenCalled();
    fireEvent.click(within(warning).getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText(RESULT.message)).toBeTruthy();
    expect(assignSubstitutesInBulk).toHaveBeenLastCalledWith({ jurorIds: ["j1"], substituteIds: ["s1"], confirmWarnings: true });
    expect(onAssigned).toHaveBeenCalledTimes(1);
  });

  it("si cancela las advertencias no guarda nada y la selección sigue", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA, LAURA]);
    assignSubstitutesInBulk.mockRejectedValueOnce(
      new AssignmentWarningsError("Rompe reglas", [{ code: "JUROR_MIXED_LEVELS", message: "Niveles mezclados" }]),
    );
    renderDialog();

    await choose("Jurados a cubrir", "Ana Pérez");
    await choose("Suplentes", "Laura Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Asignar suplentes" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(assignSubstitutesInBulk).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Asignar suplentes" }).hasAttribute("disabled")).toBe(false);
  });

  it("un bloqueo de HU-08 o un fallo del servidor se muestra y deja reintentar", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA, LAURA]);
    assignSubstitutesInBulk
      .mockRejectedValueOnce(new BulkSubstituteError("Laura es junior y el grupo es de colegios.", 400, "SCHOOL_REQUIRES_SENIOR"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderDialog();

    await choose("Jurados a cubrir", "Ana Pérez");
    await choose("Suplentes", "Laura Pérez");
    fireEvent.click(screen.getByRole("button", { name: "Asignar suplentes" }));
    expect(await screen.findByText("Laura es junior y el grupo es de colegios.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Asignar suplentes" }));
    expect(await screen.findByText("No se pudo asignar a los suplentes. No cambió ninguna asignación.")).toBeTruthy();
  });

  it("sin suplentes confirmados explica dónde marcarlos", async () => {
    fetchEditionEvaluators.mockResolvedValue([ANA]);
    renderDialog();

    expect(await screen.findByText(/No hay suplentes confirmados/)).toBeTruthy();
  });

  it("si no carga la lista deja reintentar", async () => {
    fetchEditionEvaluators.mockRejectedValueOnce(new Error("No se pudo cargar la lista de jurados.")).mockResolvedValue([ANA, LAURA]);
    renderDialog();

    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("list", { name: "Suplentes" })).toBeTruthy();
  });
});
