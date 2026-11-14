import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { juryManagement } from "@/features/jurors/management/api/juryManagement";
import { RemoveTeamDialog } from "./RemoveTeamDialog";
import type { LevelTeam } from "@/features/jurors/management/lib/manualAssignment";

vi.mock("@/features/jurors/management/api/juryManagement", () => ({
  juryManagement: {
    getTeamsByJuror: vi.fn(),
    deleteAnAssignment: vi.fn(),
  },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn(), info: vi.fn() },
}));

const delta: LevelTeam = {
  id: 400,
  name: "Equipo Delta",
  videogame: "Juego Delta",
  teamCode: "N2-ABC-201",
  level: 2,
  levelLabel: "Nivel 2",
  jurorCount: 1,
};
const professor = { id: "p-1", firstName: "Juanpipi" } as Parameters<typeof RemoveTeamDialog>[0]["juror"];
const UNDER_MIN = "El grupo N2-ABC-201 quedaría con 0 jurado(s); cada grupo necesita mínimo 3 evaluaciones.";

const openAndChoose = async () => {
  const onRemoved = vi.fn();
  render(<RemoveTeamDialog juror={professor} onRemoved={onRemoved} />);
  fireEvent.click(screen.getByRole("button", { name: "Quitar un equipo a Juanpipi" }));
  await screen.findByRole("option", { name: "Equipo Delta · Nivel 2" });
  fireEvent.change(screen.getByLabelText("Equipo a quitar"), { target: { value: "400" } });
  fireEvent.click(screen.getByRole("button", { name: "Quitar" }));
  return { onRemoved };
};

describe("RemoveTeamDialog: quitar un equipo (ARK-206)", () => {
  beforeEach(() => {
    vi.mocked(juryManagement.getTeamsByJuror).mockReset().mockResolvedValue([delta]);
    vi.mocked(juryManagement.deleteAnAssignment).mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  afterEach(cleanup);

  it("carga los equipos del profesor jurado y, sin advertencias, lo quita", async () => {
    vi.mocked(juryManagement.deleteAnAssignment).mockResolvedValue({
      success: true,
      message: "La asignación fue eliminada.",
    });
    const { onRemoved } = await openAndChoose();

    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(juryManagement.getTeamsByJuror).toHaveBeenCalledWith("p-1");
    expect(juryManagement.deleteAnAssignment).toHaveBeenCalledWith("p-1", 400, false);
    expect(toast.success).toHaveBeenCalledWith("La asignación fue eliminada.");
  });

  it("con un 409 de advertencias pide confirmación y, al continuar, repite con confirmWarnings", async () => {
    vi.mocked(juryManagement.deleteAnAssignment)
      .mockResolvedValueOnce({
        success: false,
        message: "La asignación rompe reglas.",
        warnings: [{ code: "TEAM_UNDER_MIN", message: UNDER_MIN }],
      })
      .mockResolvedValueOnce({ success: true, message: "La asignación fue eliminada." });
    const { onRemoved } = await openAndChoose();

    expect(await screen.findByText("La asignación rompe reglas de la feria")).toBeTruthy();
    expect(screen.getByText(UNDER_MIN)).toBeTruthy();
    expect(onRemoved).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(juryManagement.deleteAnAssignment).toHaveBeenNthCalledWith(1, "p-1", 400, false);
    expect(juryManagement.deleteAnAssignment).toHaveBeenNthCalledWith(2, "p-1", 400, true);
  });

  it("al cancelar las advertencias no se quita nada", async () => {
    vi.mocked(juryManagement.deleteAnAssignment).mockResolvedValue({
      success: false,
      message: "La asignación rompe reglas.",
      warnings: [{ code: "TEAM_UNDER_MIN", message: UNDER_MIN }],
    });
    const { onRemoved } = await openAndChoose();
    await screen.findByText(UNDER_MIN);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByText(UNDER_MIN)).toBeNull());
    expect(juryManagement.deleteAnAssignment).toHaveBeenCalledTimes(1);
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it("un error del servidor se muestra y no se da por quitado", async () => {
    vi.mocked(juryManagement.deleteAnAssignment).mockResolvedValue({
      success: false,
      message: "La asignación no existe.",
    });
    const { onRemoved } = await openAndChoose();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("La asignación no existe."));
    expect(onRemoved).not.toHaveBeenCalled();
  });
});
