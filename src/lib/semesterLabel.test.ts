import { describe, expect, it } from "vitest";
import { editionSemesterLabel, SEMESTER_OPTIONS, semesterLabel, semesterName } from "./semesterLabel";

describe("semesterLabel (BG-63)", () => {
  it("10 es el primer semestre, 20 el intersemestral y 30 el segundo", () => {
    expect(semesterLabel(10)).toBe("1");
    expect(semesterLabel(20)).toBe("Intersemestral");
    expect(semesterLabel(30)).toBe("2");
  });

  it("otro valor se muestra tal cual", () => {
    expect(semesterLabel(40)).toBe("40");
    expect(semesterLabel(2)).toBe("2");
  });
});

describe("editionSemesterLabel (BG-63)", () => {
  it("arma «año - semestre» sin la S", () => {
    expect(editionSemesterLabel({ year: 2026, semester: 30 })).toBe("2026 - 2");
    expect(editionSemesterLabel({ year: 2026, semester: 10 })).toBe("2026 - 1");
    expect(editionSemesterLabel({ year: 2026, semester: 20 })).toBe("2026 - Intersemestral");
  });
});

describe("semesterName y SEMESTER_OPTIONS (BG-66)", () => {
  it("nombra el semestre en vez de mostrar 10, 20 o 30", () => {
    expect(semesterName(10)).toBe("Primer semestre");
    expect(semesterName(20)).toBe("Intersemestral");
    expect(semesterName(30)).toBe("Segundo semestre");
    expect(SEMESTER_OPTIONS).toEqual([
      { value: 10, label: "Primer semestre" },
      { value: 20, label: "Intersemestral" },
      { value: 30, label: "Segundo semestre" },
    ]);
  });
});
