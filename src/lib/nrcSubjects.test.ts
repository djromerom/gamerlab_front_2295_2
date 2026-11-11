import { describe, expect, it } from "vitest";
import {
  markedSubjectIds,
  nrcOptionText,
  subjectsFromOptions,
  subjectsMissingNrc,
} from "@/lib/nrcSubjects";

const OPTIONS = [
  { code: 3031, subjectId: 3, subject: { id: 3, name: "Estructura de Datos I", abrevName: "EDI" }, professorName: "Ana Ruiz" },
  { code: 3032, subjectId: 3, subject: { id: 3, name: "Estructura de Datos I", abrevName: "EDI" }, professorName: "Pedro Lara" },
  { code: 3041, subjectId: 4, subject: { id: 4, name: "Programación Orientada a Objetos", abrevName: "POO" } },
];

describe("materias y NRC del registro (HU-31, ARK-193)", () => {
  it("agrupa los NRC por materia sin repetir", () => {
    expect(subjectsFromOptions(OPTIONS)).toEqual([
      { id: "3", name: "Estructura de Datos I", abrevName: "EDI" },
      { id: "4", name: "Programación Orientada a Objetos", abrevName: "POO" },
    ]);
  });

  it("muestra el NRC con su profesor", () => {
    expect(nrcOptionText(OPTIONS[0])).toBe("3031 · Prof. Ana Ruiz");
    expect(nrcOptionText(OPTIONS[2])).toBe("3041");
  });

  it("marca las materias con NRC y las marcadas a mano, y reporta las que no tienen NRC", () => {
    const subjects = subjectsFromOptions(OPTIONS);
    expect(markedSubjectIds(subjects, OPTIONS, ["3032"], [])).toEqual(["3"]);
    expect(markedSubjectIds(subjects, OPTIONS, ["3032"], ["4"])).toEqual(["3", "4"]);
    expect(subjectsMissingNrc(subjects, OPTIONS, ["3032"], ["4"]).map((s) => s.abrevName)).toEqual(["POO"]);
    expect(subjectsMissingNrc(subjects, OPTIONS, ["3032", "3041"], ["4"])).toEqual([]);
  });
});
