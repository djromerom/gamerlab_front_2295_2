import { describe, expect, it } from "vitest";
import { formatGrade, gradeLabel, roundGrade } from "./grades";

describe("formatGrade (BG-30)", () => {
  it.each([
    [3.5, "3.50"],
    [3.54, "3.54"],
    [4, "4.00"],
    [0, "0.00"],
    ["3.64", "3.64"],
  ])("%s se muestra como %s", (value, expected) => {
    expect(formatGrade(value)).toBe(expected);
  });

  it.each([null, undefined, Number.NaN, "", "abc"])("%s no es una nota", (value) => {
    expect(formatGrade(value as number | string | null | undefined)).toBeNull();
  });

  it("profesor 3.50 y jurado 3.64 con 70/30 dan 3.54, no 3.5", () => {
    const final = 0.7 * 3.5 + 0.3 * 3.64;
    expect(formatGrade(final)).toBe("3.54");
    expect(roundGrade(final)).toBe(3.54);
  });
});

describe("gradeLabel (BG-32)", () => {
  it.each([
    [5, "Excelente"],
    [4.5, "Excelente"],
    [4.49, "Muy bueno"],
    [4, "Muy bueno"],
    [3.99, "Bueno"],
    [3.5, "Bueno"],
    [3.49, "Aceptable"],
    [3, "Aceptable"],
    [2.99, "Insuficiente"],
    [0, "Insuficiente"],
  ])("%s → %s", (value, expected) => {
    expect(gradeLabel(value)).toBe(expected);
  });

  it("redondea a 2 decimales antes de elegir: 4.495 es Excelente y 4.494 es Muy bueno", () => {
    expect(gradeLabel(4.495)).toBe("Excelente");
    expect(gradeLabel(4.494)).toBe("Muy bueno");
  });

  it("3.5 ya no es «Excelente»", () => {
    expect(gradeLabel(3.5)).not.toBe("Excelente");
  });

  it.each([null, undefined, Number.NaN])("%s no tiene etiqueta", (value) => {
    expect(gradeLabel(value)).toBeNull();
  });
});
