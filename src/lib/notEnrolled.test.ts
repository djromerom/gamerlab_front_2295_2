import { describe, expect, it } from "vitest";
import { NotEnrolledError, isNotEnrolledError } from "./notEnrolled";

describe("NotEnrolledError (ARK-128)", () => {
  it("se distingue de un error de carga cualquiera", () => {
    expect(isNotEnrolledError(new NotEnrolledError())).toBe(true);
    expect(isNotEnrolledError(new Error("No se pudieron cargar los datos del equipo."))).toBe(false);
    expect(isNotEnrolledError("texto")).toBe(false);
  });

  it("lleva un mensaje por defecto y acepta uno propio", () => {
    expect(new NotEnrolledError().message).toMatch(/edición actual/);
    expect(new NotEnrolledError("Sin equipo").message).toBe("Sin equipo");
  });
});
