import { describe, expect, it } from "vitest";
import { canSeeJurorCategory, jurorCategoryForViewer, JUROR_PUBLIC_LABEL } from "@/lib/jurorLabel";

describe("Etiqueta del jurado según quién mira (HU-35)", () => {
  it("el administrador y los profesores ven la categoría", () => {
    expect(canSeeJurorCategory("Administrador")).toBe(true);
    expect(canSeeJurorCategory("Profesor")).toBe(true);
    expect(jurorCategoryForViewer("Senior", "Administrador")).toBe("Senior");
    expect(jurorCategoryForViewer("Junior", "Profesor")).toBe("Junior");
  });

  it("jurados, estudiantes, staff, consultores y visitantes ven solo «Jurado»", () => {
    for (const role of ["Jurado", "Estudiante", "Staff", "Consultor", null, undefined] as const) {
      expect(canSeeJurorCategory(role)).toBe(false);
      expect(jurorCategoryForViewer("Senior", role)).toBe(JUROR_PUBLIC_LABEL);
      expect(jurorCategoryForViewer("Junior", role)).toBe("Jurado");
    }
  });
});
