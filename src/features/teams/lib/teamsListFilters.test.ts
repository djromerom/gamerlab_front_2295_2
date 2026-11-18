import { describe, expect, it } from "vitest";
import { ALL_ROWS_LIMIT, limitFromRowsValue, rowsSelectValue } from "./teamsListFilters";

describe("selector «Filas» de Equipos Inscritos (BG-53)", () => {
  it("las opciones numéricas se muestran tal cual", () => {
    expect(rowsSelectValue(5)).toBe("5");
    expect(rowsSelectValue(20)).toBe("20");
    expect(rowsSelectValue(undefined)).toBe("10");
  });

  it("«Todos» queda seleccionado con el límite pedido y con el tope que responde el back", () => {
    expect(rowsSelectValue(ALL_ROWS_LIMIT)).toBe("all");
    expect(rowsSelectValue(1000)).toBe("all");
  });

  it("convierte el valor del selector en el límite a pedir", () => {
    expect(limitFromRowsValue("15")).toBe(15);
    expect(limitFromRowsValue("all")).toBe(ALL_ROWS_LIMIT);
  });
});
