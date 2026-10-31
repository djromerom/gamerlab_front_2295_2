import { cleanup, fireEvent, render } from "@testing-library/react";
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
});
