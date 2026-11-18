import { describe, expect, it } from "vitest";
import {
  DEFAULT_FINAL_GRADE_WEIGHTING_TEXT,
  PUBLIC_FINAL_GRADE_WEIGHTING_TEXT,
  formatFinalGradeWeighting,
} from "./finalGradeWeights";

describe("formatFinalGradeWeighting", () => {
  it("dice que el porcentaje de jurados es de los junior (HU-34)", () => {
    expect(formatFinalGradeWeighting(60, 40)).toBe("Nota final: 60 % profesores y 40 % jurados junior");
    expect(formatFinalGradeWeighting(70, 30)).toBe("Nota final: 70 % profesores y 30 % jurados junior");
  });

  it("la regla vigente para el panel del profesor es 60/40 (P-02)", () => {
    expect(DEFAULT_FINAL_GRADE_WEIGHTING_TEXT).toBe("Nota final: 60 % profesores y 40 % jurados junior");
  });

  it("en el ranking público no dice «junior» (HU-35)", () => {
    expect(PUBLIC_FINAL_GRADE_WEIGHTING_TEXT).toBe("Nota final: 60 % profesores y 40 % jurados");
  });
});
