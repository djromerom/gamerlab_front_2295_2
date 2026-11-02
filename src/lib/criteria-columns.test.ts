import { describe, expect, it } from "vitest";
import { buildCriteriaColumns, getCriterionValue } from "./criteria-columns";

describe("criteria columns", () => {
  it("las columnas salen de GET /criteria por id y orden", () => {
    const columns = buildCriteriaColumns(
      [
        { id: 3, name: "Resultados" },
        { id: 1, name: "Interfaz de Usuario " },
        { id: 2, name: "Interacción" },
      ],
      [],
    );
    expect(columns.map((c) => c.id)).toEqual([1, 2, 3]);
    expect(columns.map((c) => c.name)).toEqual(["Interfaz de Usuario", "Interacción", "Resultados"]);
  });

  it("un criterio renombrado por el admin sigue mostrándose", () => {
    const columns = buildCriteriaColumns([{ id: 1, name: "Experiencia de Usuario" }], []);
    expect(columns).toHaveLength(1);
    expect(columns[0].name).toBe("Experiencia de Usuario");
    expect(getCriterionValue({ "Experiencia de Usuario": 4.2 }, columns[0])).toBe(4.2);
  });

  it("encuentra el valor aunque la clave del backend lleve espacios al final", () => {
    const [column] = buildCriteriaColumns([{ id: 1, name: "Interfaz de Usuario" }], []);
    expect(getCriterionValue({ "Interfaz de Usuario ": 3 }, column)).toBe(3);
    expect(getCriterionValue({}, column)).toBeUndefined();
  });

  it("sin lista de criterios usa las claves de los datos", () => {
    const columns = buildCriteriaColumns([], [{ criterios: { B: 1, A: 2 } }, { criterios: { A: 3 } }]);
    expect(columns.map((c) => c.name)).toEqual(["B", "A"]);
  });
});
