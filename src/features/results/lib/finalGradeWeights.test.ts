import { describe, expect, it } from "vitest";
import { formatFinalGradeWeighting } from "./finalGradeWeights";

describe("formatFinalGradeWeighting", () => {
  it("muestra los porcentajes vigentes de profesores y jurados", () => {
    expect(formatFinalGradeWeighting(60, 40)).toBe(
      "Nota final: 60 % profesores y 40 % jurados",
    );
  });
});
