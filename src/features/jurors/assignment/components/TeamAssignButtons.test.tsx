import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamAssignButtons } from "@/features/jurors/assignment/components/TeamAssignButtons";

function renderButtons(assignedCount: number, onAssign = vi.fn(), disabled = false) {
  render(
    <TeamAssignButtons
      teamId={1}
      assignedCount={assignedCount}
      requiredCount={3}
      disabled={disabled}
      onAssign={onAssign}
    />,
  );
  return onAssign;
}

const emptySlots = () =>
  screen.queryAllByRole("button", { name: "Agregar jurado en espacio vacío" });
const manualButton = () =>
  screen.getByRole("button", { name: "Asignar jurado manualmente" });

describe("TeamAssignButtons (ARK-277)", () => {
  afterEach(cleanup);

  it("con 1 jurado muestra los 2 espacios vacíos y el botón fijo", () => {
    renderButtons(1);

    expect(emptySlots()).toHaveLength(2);
    expect(manualButton()).toBeTruthy();
  });

  it("con 3 jurados ya no hay espacios vacíos, pero sigue el botón fijo", () => {
    renderButtons(3);

    expect(emptySlots()).toHaveLength(0);
    expect(manualButton()).toBeTruthy();
  });

  it("con más jurados que los requeridos sigue el botón fijo", () => {
    renderButtons(5);

    expect(emptySlots()).toHaveLength(0);
    expect(manualButton()).toBeTruthy();
  });

  it("el botón fijo y los espacios vacíos abren la asignación", () => {
    const onAssign = renderButtons(2);

    fireEvent.click(manualButton());
    fireEvent.click(emptySlots()[0]);

    expect(onAssign).toHaveBeenCalledTimes(2);
  });

  it("mientras se guarda una asignación el botón fijo queda deshabilitado", () => {
    renderButtons(3, vi.fn(), true);

    expect((manualButton() as HTMLButtonElement).disabled).toBe(true);
  });
});
