import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { juryManagement } from "@/hooks/juryManagement";
import { ManualAssignTeamDialog } from "./ManualAssignTeamDialog";
import type { LevelTeam } from "./manualAssignment";

vi.mock("@/hooks/juryManagement", () => ({
  juryManagement: {
    getTeamsByJuror: vi.fn(),
    manualAssignment: vi.fn(),
  },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn(), info: vi.fn() },
}));

const team = (overrides: Partial<LevelTeam>): LevelTeam => ({
  id: 1,
  name: "Equipo",
  videogame: "Juego",
  teamCode: "N1-ABC-001",
  level: 1,
  levelLabel: "Nivel 1",
  jurorCount: 0,
  ...overrides,
});

// Mismo orden que devuelve el back: por nivel y luego por nombre
const epsilon = team({ id: 500, name: "Equipo Epsilon", videogame: "Juego Epsilon", teamCode: "N0-ABC-001", level: 0, levelLabel: "Colegios" });
const alpha = team({ id: 100, name: "Equipo Alpha", videogame: "Juego Alpha", teamCode: "N1-ABC-010", level: 1, levelLabel: "Nivel 1", jurorCount: 2 });
const delta = team({ id: 400, name: "Equipo Delta", videogame: "Juego Delta", teamCode: "N2-ABC-201", level: 2, levelLabel: "Nivel 2", jurorCount: 1 });
const teams = [epsilon, alpha, delta];

const juror = { id: "j-1", firstName: "Ana" };

const renderDialog = (props: Partial<Parameters<typeof ManualAssignTeamDialog>[0]> = {}) => {
  const onAssigned = vi.fn();
  render(<ManualAssignTeamDialog juror={juror} teams={teams} onAssigned={onAssigned} {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Asignar equipo" }));
  return { onAssigned };
};

const teamSelect = () => screen.getByLabelText("Equipo") as HTMLSelectElement;
const optionTexts = () =>
  within(teamSelect())
    .getAllByRole("option")
    .filter((option) => (option as HTMLOptionElement).value !== "")
    .map((option) => option.textContent);

describe("ManualAssignTeamDialog (ARK-189)", () => {
  beforeEach(() => {
    vi.mocked(juryManagement.getTeamsByJuror).mockReset().mockResolvedValue([]);
    vi.mocked(juryManagement.manualAssignment).mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  afterEach(cleanup);

  it("muestra el nivel y los jurados de cada equipo, agrupados por nivel", async () => {
    renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    expect(optionTexts()).toEqual([
      "Equipo Epsilon · Colegios · 0 de 3 jurados",
      "Equipo Alpha · Nivel 1 · 2 de 3 jurados",
      "Equipo Delta · Nivel 2 · 1 de 3 jurados",
    ]);
    const groups = teamSelect().querySelectorAll("optgroup");
    expect([...groups].map((group) => group.label)).toEqual(["Colegios", "Nivel 1", "Nivel 2"]);
    expect(screen.getByText("3 de 3 equipos")).toBeTruthy();
  });

  it("el buscador filtra por nombre, videojuego o código", async () => {
    renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "delta" } });
    expect(optionTexts()).toEqual(["Equipo Delta · Nivel 2 · 1 de 3 jurados"]);

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "n0-abc" } });
    expect(optionTexts()).toEqual(["Equipo Epsilon · Colegios · 0 de 3 jurados"]);
    expect(screen.getByText("1 de 3 equipos")).toBeTruthy();
  });

  it("el filtro de nivel solo ofrece los niveles de la lista y filtra por ellos", async () => {
    renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    const levelSelect = screen.getByLabelText("Nivel") as HTMLSelectElement;
    expect([...levelSelect.options].map((option) => option.textContent)).toEqual([
      "Todos los niveles",
      "Colegios",
      "Nivel 1",
      "Nivel 2",
    ]);

    fireEvent.change(levelSelect, { target: { value: "1" } });
    expect(optionTexts()).toEqual(["Equipo Alpha · Nivel 1 · 2 de 3 jurados"]);
  });

  it("si nada coincide lo dice y no deja asignar", async () => {
    renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "zzz" } });

    expect(screen.getByRole("option", { name: "Ningún equipo coincide con la búsqueda" })).toBeTruthy();
    expect(teamSelect().disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Asignar" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("si la búsqueda esconde el equipo elegido, deja de estar seleccionado", async () => {
    renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    fireEvent.change(teamSelect(), { target: { value: "400" } });
    expect((screen.getByLabelText("Videojuego del equipo") as HTMLInputElement).value).toBe("Juego Delta");

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "alpha" } });
    expect(teamSelect().value).toBe("");
    expect((screen.getByRole("button", { name: "Asignar" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("indica los niveles que ya tiene el jurado y advierte al elegir otro nivel", async () => {
    vi.mocked(juryManagement.getTeamsByJuror).mockResolvedValue([
      team({ id: 7, name: "Equipo Ya", level: 1, levelLabel: "Nivel 1" }),
    ]);
    renderDialog();

    await screen.findByText("Este jurado ya tiene: Nivel 1");
    expect(juryManagement.getTeamsByJuror).toHaveBeenCalledWith("j-1");
    expect(optionTexts()).toEqual([
      "Equipo Epsilon · Colegios · 0 de 3 jurados · ⚠ otro nivel",
      "Equipo Alpha · Nivel 1 · 2 de 3 jurados",
      "Equipo Delta · Nivel 2 · 1 de 3 jurados · ⚠ otro nivel",
    ]);

    fireEvent.change(teamSelect(), { target: { value: "100" } });
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.change(teamSelect(), { target: { value: "400" } });
    expect(screen.getByRole("alert").textContent).toContain(
      "«Equipo Delta» es de Nivel 2 y el jurado ya tiene Nivel 1"
    );
  });

  it("marca como ya asignados los equipos que el jurado ya tiene y no deja elegirlos", async () => {
    vi.mocked(juryManagement.getTeamsByJuror).mockResolvedValue([alpha]);
    renderDialog();

    await screen.findByText("Este jurado ya tiene: Nivel 1");
    const option = within(teamSelect()).getByRole("option", { name: /Equipo Alpha/ }) as HTMLOptionElement;
    expect(option.textContent).toBe("Equipo Alpha · Nivel 1 · 2 de 3 jurados · ya asignado");
    expect(option.disabled).toBe(true);
  });

  it("si no se pueden consultar los equipos del jurado (p. ej. un profesor), el diálogo sigue funcionando", async () => {
    vi.mocked(juryManagement.getTeamsByJuror).mockRejectedValue(new Error("Error 400"));
    vi.mocked(juryManagement.manualAssignment).mockResolvedValue({ success: true, message: "Asignación exitosa" });
    const { onAssigned } = renderDialog();

    await screen.findByText("No se pudieron consultar los niveles que ya tiene este jurado.");
    fireEvent.change(teamSelect(), { target: { value: "400" } });
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));
    await waitFor(() => expect(onAssigned).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("asigna el equipo elegido, avisa y cierra el diálogo", async () => {
    vi.mocked(juryManagement.manualAssignment).mockResolvedValue({ success: true, message: "Asignación exitosa" });
    const { onAssigned } = renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    fireEvent.change(teamSelect(), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    await waitFor(() => expect(onAssigned).toHaveBeenCalledTimes(1));
    expect(juryManagement.manualAssignment).toHaveBeenCalledWith("j-1", 500, false);
    expect(toast.success).toHaveBeenCalledWith("Asignación exitosa");
    expect(screen.queryByText("Asignar equipo a Ana")).toBeNull();
  });

  it("con un 409 de advertencias pide confirmación y, al continuar, repite con confirmWarnings", async () => {
    vi.mocked(juryManagement.getTeamsByJuror).mockResolvedValue([alpha]);
    vi.mocked(juryManagement.manualAssignment)
      .mockResolvedValueOnce({
        success: false,
        message: "La asignación rompe reglas de la feria.",
        warnings: [
          {
            code: "JUROR_MIXED_LEVELS",
            message: "El jurado quedaría con grupos de distintos niveles (Nivel 1, Nivel 2).",
          },
        ],
      })
      .mockResolvedValueOnce({ success: true, message: "Asignación exitosa" });
    const { onAssigned } = renderDialog();
    await screen.findByText("Este jurado ya tiene: Nivel 1");

    fireEvent.change(teamSelect(), { target: { value: "400" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    expect(await screen.findByText("La asignación rompe reglas de la feria")).toBeTruthy();
    expect(screen.getByText("El jurado quedaría con grupos de distintos niveles (Nivel 1, Nivel 2).")).toBeTruthy();
    expect(onAssigned).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(onAssigned).toHaveBeenCalledTimes(1));
    expect(juryManagement.manualAssignment).toHaveBeenNthCalledWith(1, "j-1", 400, false);
    expect(juryManagement.manualAssignment).toHaveBeenNthCalledWith(2, "j-1", 400, true);
  });

  it("al cancelar las advertencias no se repite la asignación", async () => {
    vi.mocked(juryManagement.manualAssignment).mockResolvedValue({
      success: false,
      message: "La asignación rompe reglas de la feria.",
      warnings: [{ code: "TEAM_UNDER_MIN", message: "Advertencia de prueba" }],
    });
    const { onAssigned } = renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    fireEvent.change(teamSelect(), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));
    await screen.findByText("Advertencia de prueba");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByText("Advertencia de prueba")).toBeNull());
    expect(juryManagement.manualAssignment).toHaveBeenCalledTimes(1);
    expect(onAssigned).not.toHaveBeenCalled();
  });

  it("un bloqueo del servidor se muestra como error y no cierra el diálogo", async () => {
    vi.mocked(juryManagement.manualAssignment).mockResolvedValue({
      success: false,
      message: "El jurado no tiene categoría.",
    });
    const { onAssigned } = renderDialog();
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    fireEvent.change(teamSelect(), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("El jurado no tiene categoría."));
    expect(onAssigned).not.toHaveBeenCalled();
    expect(screen.getByText("Asignar equipo a Ana")).toBeTruthy();
  });

  it("mientras cargan los equipos lo indica y no deja buscar", async () => {
    renderDialog({ teams: null });
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    expect(screen.getByRole("option", { name: "Cargando equipos..." })).toBeTruthy();
    expect((screen.getByLabelText("Buscar") as HTMLInputElement).disabled).toBe(true);
  });

  it("si no hay equipos pendientes de jurados lo dice", async () => {
    renderDialog({ teams: [] });
    await screen.findByText("Este jurado aún no tiene equipos asignados.");

    expect(screen.getByRole("option", { name: "No hay equipos pendientes de jurados" })).toBeTruthy();
  });
});
