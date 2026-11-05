import { describe, expect, it } from "vitest";
import { formatGrade, roundGrade } from "./grades";

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
