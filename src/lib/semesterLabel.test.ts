import { describe, expect, it } from "vitest";
import { editionSemesterLabel, semesterLabel } from "./semesterLabel";

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
