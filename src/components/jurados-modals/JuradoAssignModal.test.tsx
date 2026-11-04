import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JuradoAssignModal } from "@/components/jurados-modals/JuradoAssignModal";

const team = {
  id: 1,
  name: "Equipo A",
  game: "Juego A",
  semester: "2026-1",
  jurados: [],
  requiredJurados: 3,
} as never;

describe("JuradoAssignModal", () => {
  afterEach(cleanup);

  it("Escape cierra el diálogo «Asignar Jurado»", () => {
    const onClose = vi.fn();
    render(
      <JuradoAssignModal
        selectedTeam={team}
        juradosDisponiblesParaModal={[]}
        reassignContext={null}
        isSubmitting={false}
        onClose={onClose}
        onAssign={vi.fn()}
        onReassign={vi.fn()}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("ARK-131: muestra dentro del diálogo el motivo del bloqueo que envía el back", () => {
    const message =
      "No se pueden modificar los jurados del equipo N1-AYP-01: pertenece a «Feria 4», que no es la edición activa. Las ediciones anteriores son de solo lectura.";
    render(
      <JuradoAssignModal
        selectedTeam={team}
        juradosDisponiblesParaModal={[]}
        reassignContext={null}
        isSubmitting={false}
        errorMessage={message}
        onClose={vi.fn()}
        onAssign={vi.fn()}
        onReassign={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert").textContent).toBe(message);
  });

  it("sin error no muestra el aviso", () => {
    render(
      <JuradoAssignModal
        selectedTeam={team}
        juradosDisponiblesParaModal={[]}
        reassignContext={null}
        isSubmitting={false}
        onClose={vi.fn()}
        onAssign={vi.fn()}
        onReassign={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
