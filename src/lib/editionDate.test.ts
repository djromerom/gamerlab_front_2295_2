import { describe, expect, it } from "vitest";
import { formatEditionDate } from "./editionDate";

describe("formatEditionDate", () => {
  it("usa el formato de «Información»: día de la semana, día y mes con la primera en mayúscula", () => {
    expect(formatEditionDate("2026-05-14T12:00:00.000Z")).toBe("Jueves 14 de mayo");
  });

  it("agrega el año cuando se pide (ediciones pasadas)", () => {
    expect(formatEditionDate("2025-05-15T12:00:00.000Z", { withYear: true })).toBe(
      "Jueves 15 de mayo de 2025",
    );
  });

  it("devuelve «Por Definir» sin fecha y «Fecha Inválida» con fecha mala", () => {
    expect(formatEditionDate(undefined)).toBe("Por Definir");
    expect(formatEditionDate("xx")).toBe("Fecha Inválida");
  });
});
