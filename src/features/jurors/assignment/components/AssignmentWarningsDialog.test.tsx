import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssignmentWarningsDialog } from "@/features/jurors/assignment/components/AssignmentWarningsDialog";

const warnings = [
  {
    code: "JUROR_OVER_LIMIT",
    message: "El jurado senior Luis Gómez quedaría con 4 grupos; el máximo recomendado es 3 por jurado.",
  },
  {
    code: "JUROR_MIXED_LEVELS",
    message: "El jurado senior Luis Gómez quedaría con grupos de distintos niveles (N1, N2).",
  },
];

describe("AssignmentWarningsDialog", () => {
  afterEach(cleanup);

  it("no muestra nada si no hay advertencias pendientes", () => {
    render(
      <AssignmentWarningsDialog warnings={null} onContinue={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("lista cada advertencia con los botones Continuar y Cancelar", () => {
    render(
      <AssignmentWarningsDialog warnings={warnings} onContinue={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.getByText("La asignación rompe reglas de la feria")).toBeTruthy();
    expect(screen.getByText(warnings[0].message)).toBeTruthy();
    expect(screen.getByText(warnings[1].message)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
  });

  it("Continuar llama a onContinue", () => {
    const onContinue = vi.fn();
    render(
      <AssignmentWarningsDialog warnings={warnings} onContinue={onContinue} onCancel={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("Cancelar llama a onCancel y no a onContinue", () => {
    const onContinue = vi.fn();
    const onCancel = vi.fn();
    render(
      <AssignmentWarningsDialog warnings={warnings} onContinue={onContinue} onCancel={onCancel} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("si el back no pudo comprobar las reglas, pregunta si guardar de todos modos", () => {
    render(
      <AssignmentWarningsDialog
        warnings={[{ code: "VALIDATION_UNAVAILABLE", message: "No se pudieron cargar los datos." }]}
        onContinue={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("No se pudieron comprobar las reglas")).toBeTruthy();
    expect(
      screen.getByText(
        "No se pudieron comprobar las reglas de asignación. ¿Guardar de todos modos?"
      )
    ).toBeTruthy();
  });

  it("Escape cancela sin cerrar el modal de asignar que está debajo", () => {
    const onCancel = vi.fn();
    const modalBelow = vi.fn();
    document.addEventListener("keydown", modalBelow);

    render(
      <AssignmentWarningsDialog warnings={warnings} onContinue={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Cancelar" }), { key: "Escape" });

    document.removeEventListener("keydown", modalBelow);
    expect(onCancel).toHaveBeenCalled();
    expect(modalBelow).not.toHaveBeenCalled();
  });
});
