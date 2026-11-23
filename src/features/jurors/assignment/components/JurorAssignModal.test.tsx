import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JurorAssignModal } from "@/features/jurors/assignment/components/JurorAssignModal";

const team = {
  id: 1,
  name: "Equipo A",
  game: "Juego A",
  semester: "2026-1",
  jurados: [],
  requiredJurados: 3,
} as never;

describe("JurorAssignModal", () => {
  afterEach(cleanup);

  it("Escape cierra el diálogo «Asignar Jurado»", () => {
    const onClose = vi.fn();
    render(
      <JurorAssignModal
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
      <JurorAssignModal
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
      <JurorAssignModal
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

  describe("ARK-277: jurado adicional", () => {
    const fullTeam = {
      ...(team as object),
      jurados: [{ id: "j1" }, { id: "j2" }, { id: "j3" }],
    } as never;
    const aviso = /quedará como jurado adicional/;

    it("avisa que el jurado elegido será adicional cuando el equipo ya tiene 3", () => {
      render(
        <JurorAssignModal
          selectedTeam={fullTeam}
          juradosDisponiblesParaModal={[]}
          reassignContext={null}
          isSubmitting={false}
          onClose={vi.fn()}
          onAssign={vi.fn()}
          onReassign={vi.fn()}
        />,
      );

      expect(screen.getByText(aviso)).toBeTruthy();
      expect(screen.getByText("3/3 jurados asignados")).toBeTruthy();
    });

    it("no avisa si el equipo aún tiene espacios", () => {
      render(
        <JurorAssignModal
          selectedTeam={team}
          juradosDisponiblesParaModal={[]}
          reassignContext={null}
          isSubmitting={false}
          onClose={vi.fn()}
          onAssign={vi.fn()}
          onReassign={vi.fn()}
        />,
      );

      expect(screen.queryByText(aviso)).toBeNull();
    });

    it("no avisa al reasignar, porque no suma jurados", () => {
      render(
        <JurorAssignModal
          selectedTeam={fullTeam}
          juradosDisponiblesParaModal={[]}
          reassignContext={{ teamId: 1, currentJurorId: "j1", currentJurorName: "Ana" }}
          isSubmitting={false}
          onClose={vi.fn()}
          onAssign={vi.fn()}
          onReassign={vi.fn()}
        />,
      );

      expect(screen.queryByText(aviso)).toBeNull();
    });
  });
});
