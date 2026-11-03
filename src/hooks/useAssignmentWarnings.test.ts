import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAssignmentWarnings } from "@/hooks/useAssignmentWarnings";
import { AssignmentWarningsError } from "@/lib/assignmentWarnings";

const warnings = [
  { code: "TEAM_UNDER_MIN", message: "El grupo quedaría con 2 jurados; el mínimo es 3." },
];

describe("useAssignmentWarnings", () => {
  it("abre el diálogo con las advertencias y Continuar repite la petición confirmándolas", () => {
    const { result } = renderHook(() => useAssignmentWarnings());
    const confirm = vi.fn().mockResolvedValue(undefined);

    let handled = false;
    act(() => {
      handled = result.current.askToConfirm(
        new AssignmentWarningsError("Confirma para continuar", warnings),
        confirm
      );
    });

    expect(handled).toBe(true);
    expect(result.current.warnings).toEqual(warnings);

    act(() => result.current.continueWithWarnings());

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(result.current.warnings).toBeNull();
  });

  it("Cancelar cierra el diálogo sin repetir la petición", () => {
    const { result } = renderHook(() => useAssignmentWarnings());
    const confirm = vi.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.askToConfirm(new AssignmentWarningsError("x", warnings), confirm);
    });
    act(() => result.current.cancel());

    expect(confirm).not.toHaveBeenCalled();
    expect(result.current.warnings).toBeNull();
  });

  it("los demás errores no abren el diálogo: quien llama muestra su aviso", () => {
    const { result } = renderHook(() => useAssignmentWarnings());
    const confirm = vi.fn();

    let handled = true;
    act(() => {
      handled = result.current.askToConfirm(
        new Error("El evaluador ya está asignado a este equipo."),
        confirm
      );
    });

    expect(handled).toBe(false);
    expect(result.current.warnings).toBeNull();
    expect(confirm).not.toHaveBeenCalled();
  });
});
