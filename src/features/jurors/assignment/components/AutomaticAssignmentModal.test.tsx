import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { AutomaticAssignmentModal } from "@/features/jurors/assignment/components/AutomaticAssignmentModal";
import { groupAlerts } from "@/features/jurors/assignment/lib/automaticAssignmentAlerts";
import {
  AUTO_ASSIGNMENT_OUTDATED,
  AutomaticAssignmentError,
  confirmAutomaticAssignment,
  previewAutomaticAssignment,
  type AutoAssignmentPreview,
} from "@/features/jurors/assignment/api/automaticAssignment";

vi.mock("@/features/jurors/assignment/api/automaticAssignment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/jurors/assignment/api/automaticAssignment")>();
  return {
    ...actual,
    previewAutomaticAssignment: vi.fn(),
    confirmAutomaticAssignment: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const preview = vi.mocked(previewAutomaticAssignment);
const confirm = vi.mocked(confirmAutomaticAssignment);

function buildPreview(overrides: Partial<AutoAssignmentPreview> = {}): AutoAssignmentPreview {
  return {
    edition: { id: 5, title: "Feria 2026-2", status: "ACTIVE", writable: true },
    backupJurorsExcluded: 2,
    limits: { maxTeamsPerJuror: 3, jurorsPerTeam: 3 },
    assignments: [
      { teamId: 12, jurorId: "j-ana" },
      { teamId: 31, jurorId: "j-ana" },
    ],
    summary: {
      teams: 2,
      completeTeams: 1,
      incompleteTeams: 1,
      teamsWithoutSenior: 1,
      newAssignments: 2,
      availableJurors: 3,
      jurorsWithNewTeams: 1,
    },
    levels: [
      { level: 1, label: "Universitarios N1", teams: 1, completeTeams: 1, missingSlots: 0, teamsWithoutSenior: 0, jurors: 2 },
      { level: 2, label: "Universitarios N2", teams: 1, completeTeams: 0, missingSlots: 1, teamsWithoutSenior: 1, jurors: 1 },
    ],
    teams: [
      {
        id: 12,
        teamCode: "N1-AYP-06",
        teamName: "Los Pixeles",
        level: 1,
        complete: true,
        hasSenior: true,
        jurors: [
          { id: "j-ana", name: "Ana Pérez", kind: "PROFESSOR", jurorCategory: null, fixed: false },
          { id: "j-luis", name: "Luis Gómez", kind: "JUROR", jurorCategory: "JUNIOR", fixed: true },
          { id: "j-eva", name: "Eva Ruiz", kind: "JUROR", jurorCategory: "SENIOR", fixed: true },
        ],
      },
      {
        id: 31,
        teamCode: "N2-AYP2-05",
        teamName: "Game Lab",
        level: 2,
        complete: false,
        hasSenior: false,
        jurors: [
          { id: "j-mar", name: "Mar Díaz", kind: "JUROR", jurorCategory: "JUNIOR", fixed: true },
          { id: "j-ana", name: "Ana Pérez", kind: "PROFESSOR", jurorCategory: null, fixed: false },
        ],
      },
    ],
    jurors: [
      { id: "j-ana", name: "Ana Pérez", kind: "PROFESSOR", jurorCategory: null, level: 1, teamsBefore: 0, teamsAfter: 2 },
    ],
    alerts: [
      { code: "TEAM_INCOMPLETE", message: "El grupo N2-AYP2-05 (Game Lab) queda con 2 de 3 jurados.", teamId: 31, level: 2 },
      { code: "TEAM_WITHOUT_SENIOR", message: "El grupo N2-AYP2-05 (Game Lab) queda sin jurado senior.", teamId: 31, level: 2 },
      { code: "SCHOOL_WITHOUT_SENIOR_JURORS", message: "No alcanzan los jurados senior para los colegios.", level: 0 },
    ],
    ...overrides,
  };
}

const confirmButton = () =>
  screen.getByRole("button", { name: /^Confirmar/ }) as HTMLButtonElement;

function renderModal() {
  const onClose = vi.fn();
  const onConfirmed = vi.fn();
  render(<AutomaticAssignmentModal onClose={onClose} onConfirmed={onConfirmed} />);
  return { onClose, onConfirmed };
}

describe("AutomaticAssignmentModal (HU-07, ARK-115)", () => {
  beforeEach(() => {
    preview.mockReset();
    confirm.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.warning).mockClear();
  });

  afterEach(cleanup);

  it("al abrir pide la vista previa sin límite y muestra el resumen", async () => {
    preview.mockResolvedValue(buildPreview());
    renderModal();

    expect(screen.getByText("Calculando la asignación…")).toBeTruthy();
    expect(await screen.findByText("Feria 2026-2")).toBeTruthy();

    expect(preview).toHaveBeenCalledTimes(1);
    expect(preview).toHaveBeenCalledWith(undefined);
    expect(screen.getByText("2 suplentes quedan de reserva", { exact: false })).toBeTruthy();
    expect((screen.getByText("Asignaciones nuevas").nextSibling)?.textContent).toContain("2");
    expect((confirmButton())?.textContent).toContain("Confirmar 2 asignaciones");
    expect(confirmButton().disabled).toBe(false);
    // No se guardó nada todavía
    expect(confirm).not.toHaveBeenCalled();
  });

  it("agrupa las alertas por código, de la más grave a la menos grave", async () => {
    preview.mockResolvedValue(buildPreview());
    renderModal();

    const alerts = await screen.findByRole("region", { name: "Alertas" });
    const titles = within(alerts)
      .getAllByRole("group")
      .map((group) => group.querySelector("summary")?.textContent);

    expect(titles).toEqual([
      expect.stringContaining("No alcanzan los jurados senior para los colegios"),
      expect.stringContaining("Grupos que quedan incompletos"),
      expect.stringContaining("Grupos universitarios sin jurado senior"),
    ]);
    expect(within(alerts).getByText("El grupo N2-AYP2-05 (Game Lab) queda con 2 de 3 jurados.")).toBeTruthy();
  });

  it("resalta los jurados nuevos y marca los que ya estaban asignados", async () => {
    preview.mockResolvedValue(buildPreview());
    renderModal();

    const team = await screen.findByTestId("auto-team-12");
    expect((within(team).getByText("Ana Pérez").closest("li"))?.textContent).toContain("Nuevo");
    expect((within(team).getByText("Luis Gómez").closest("li"))?.textContent).toContain("Ya asignado");

    const incomplete = screen.getByTestId("auto-team-31");
    expect((incomplete)?.textContent).toContain("2/3 jurados");
    expect((incomplete)?.textContent).toContain("Sin senior");
  });

  it("el filtro «Solo con alertas» deja solo los grupos con alertas", async () => {
    preview.mockResolvedValue(buildPreview());
    renderModal();
    await screen.findByTestId("auto-team-12");

    fireEvent.change(screen.getByLabelText("Filtrar grupos"), { target: { value: "alerts" } });

    expect(screen.queryByTestId("auto-team-12")).toBeNull();
    expect(screen.getByTestId("auto-team-31")).toBeTruthy();
  });

  it("confirmar envía el mismo arreglo de la vista previa y avisa al padre", async () => {
    const data = buildPreview();
    preview.mockResolvedValue(data);
    const result = { message: "Se guardaron 2 asignaciones en 2 grupos.", saved: 2 } as never;
    confirm.mockResolvedValue(result);
    const { onConfirmed } = renderModal();
    await screen.findByText("Feria 2026-2");

    fireEvent.click(confirmButton());

    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(result));
    expect(confirm).toHaveBeenCalledWith(data.assignments, undefined);
    expect(toast.success).toHaveBeenCalledWith("Se guardaron 2 asignaciones en 2 grupos.");
  });

  it("si el plan cambió (409) avisa y vuelve a pedir la vista previa sin cerrar", async () => {
    const outdated =
      "La asignación cambió desde la vista previa (equipos, jurados o asignaciones nuevas). No se guardó nada: genera la vista previa otra vez.";
    preview.mockResolvedValueOnce(buildPreview());
    preview.mockResolvedValueOnce(
      buildPreview({
        assignments: [{ teamId: 31, jurorId: "j-ana" }],
        summary: { ...buildPreview().summary, newAssignments: 1 },
      }),
    );
    confirm.mockRejectedValue(new AutomaticAssignmentError(outdated, 409, AUTO_ASSIGNMENT_OUTDATED));
    const { onConfirmed, onClose } = renderModal();
    await screen.findByText("Feria 2026-2");

    fireEvent.click(confirmButton());

    expect(await screen.findByText(outdated)).toBeTruthy();
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(2));
    expect(toast.warning).toHaveBeenCalledWith(outdated);
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() => expect((confirmButton())?.textContent).toContain("Confirmar 1 asignación"));
  });

  it("un error al guardar (500) se muestra y deja la vista previa abierta", async () => {
    preview.mockResolvedValue(buildPreview());
    const message =
      "No se pudo guardar la asignación automática. Se revirtió todo y se mantienen las asignaciones anteriores.";
    confirm.mockRejectedValue(new AutomaticAssignmentError(message, 500));
    const { onConfirmed } = renderModal();
    await screen.findByText("Feria 2026-2");

    fireEvent.click(confirmButton());

    expect((await screen.findByRole("alert"))?.textContent).toContain(message);
    expect(preview).toHaveBeenCalledTimes(1);
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(confirmButton().disabled).toBe(false);
  });

  it("sin asignaciones nuevas lo dice y deshabilita Confirmar", async () => {
    preview.mockResolvedValue(
      buildPreview({ assignments: [], summary: { ...buildPreview().summary, newAssignments: 0 } }),
    );
    renderModal();

    expect(await screen.findByText("No hay asignaciones nuevas por hacer.")).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);
  });

  it("si la vista previa falla (400) muestra el motivo del back y no deja confirmar", async () => {
    const message =
      'No hay jurados oficiales en la edición "Feria 2026-2": confirma los jurados en "Jurados de la edición" o carga los NRC de los profesores.';
    preview.mockRejectedValue(new AutomaticAssignmentError(message, 400));
    renderModal();

    expect((await screen.findByRole("alert"))?.textContent).toContain(message);
    expect(confirmButton().disabled).toBe(true);
  });

  it("si ningún jurado puede recibir grupos, «Por jurado» lo explica en vez de hablar de filtros", async () => {
    preview.mockResolvedValue(buildPreview({ jurors: [] }));
    renderModal();
    await screen.findByText("Feria 2026-2");

    fireEvent.click(screen.getByRole("tab", { name: /Por jurado/ }));

    expect(screen.getByText(/Ningún jurado puede recibir grupos nuevos/)).toBeTruthy();
    expect(screen.queryByText("No hay jurados con este filtro.")).toBeNull();
  });

  it("Cancelar cierra sin llamar a confirmar", async () => {
    preview.mockResolvedValue(buildPreview());
    const { onClose } = renderModal();
    await screen.findByText("Feria 2026-2");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("Escape cierra el diálogo", async () => {
    preview.mockResolvedValue(buildPreview());
    const { onClose } = renderModal();
    await screen.findByText("Feria 2026-2");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cambiar el límite obliga a recalcular y confirma con el mismo valor", async () => {
    const data = buildPreview();
    preview.mockResolvedValue(data);
    confirm.mockResolvedValue({ message: "ok" } as never);
    renderModal();
    await screen.findByText("Feria 2026-2");

    const input = screen.getByLabelText("Máximo de grupos por jurado");
    fireEvent.change(input, { target: { value: "4" } });
    expect(confirmButton().disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Recalcular vista previa/ }));
    await waitFor(() => expect(preview).toHaveBeenLastCalledWith(4));
    await waitFor(() => expect(confirmButton().disabled).toBe(false));

    fireEvent.click(confirmButton());
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(data.assignments, 4));
  });

  it("no recalcula con un límite fuera de rango", async () => {
    preview.mockResolvedValue(buildPreview());
    renderModal();
    await screen.findByText("Feria 2026-2");

    fireEvent.change(screen.getByLabelText("Máximo de grupos por jurado"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /Recalcular vista previa/ }));

    expect(screen.getByText("Escribe un número entero entre 1 y 20.")).toBeTruthy();
    expect(preview).toHaveBeenCalledTimes(1);
  });
});

describe("groupAlerts", () => {
  it("pone los códigos desconocidos al final como «Otras alertas»", () => {
    const groups = groupAlerts([
      { code: "ALGO_NUEVO", message: "x" },
      { code: "JUROR_MISSING_CATEGORY", message: "y", jurorId: "j-1" },
    ]);

    expect(groups.map((group) => group.code)).toEqual(["JUROR_MISSING_CATEGORY", "OTHER"]);
    expect(groups[0].hint).toBe("Se corrige en Personal → Jurados.");
  });
});
