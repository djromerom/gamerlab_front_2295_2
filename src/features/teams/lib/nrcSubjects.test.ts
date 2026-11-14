import { describe, expect, it } from "vitest";
import {
  markedSubjectIds,
  nrcOptionText,
  subjectsFromOptions,
  subjectsMissingNrc,
} from "@/features/teams/lib/nrcSubjects";

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

  it("distingue dos materias con la misma abreviatura sin depender del cursor", () => {
    const options = [
      { code: 3011, subjectId: 2, subject: { id: 2, name: "Algoritmia y Programación I", abrevName: "AYP" } },
      { code: 3012, subjectId: 2, subject: { id: 2, name: "Algoritmia y Programación I", abrevName: "AYP" } },
      { code: 3021, subjectId: 3, subject: { id: 3, name: "Algoritmia y Programación II", abrevName: "AYP" } },
      { code: 3022, subjectId: 3, subject: { id: 3, name: "Algoritmia y Programación II", abrevName: "AYP" } },
      OPTIONS[2],
    ];
    expect(subjectsFromOptions(options).map((s) => s.abrevName)).toEqual([
      "AYP · I",
      "AYP · II",
      "POO",
    ]);
  });

  it("usa el nombre completo si la última palabra no basta, y el id si el nombre también se repite", () => {
    const sameEnding = subjectsFromOptions([
      { code: 1, subjectId: 1, subject: { id: 1, name: "Cálculo de Ingeniería", abrevName: "CAL" } },
      { code: 2, subjectId: 2, subject: { id: 2, name: "Química de Ingeniería", abrevName: "CAL" } },
    ]);
    expect(sameEnding.map((s) => s.abrevName)).toEqual(["Cálculo de Ingeniería", "Química de Ingeniería"]);

    const sameName = subjectsFromOptions([
      { code: 1, subjectId: 1, subject: { id: 1, name: "Física I", abrevName: "FIS" } },
      { code: 2, subjectId: 2, subject: { id: 2, name: "Física I", abrevName: "FIS" } },
    ]);
    expect(sameName.map((s) => s.abrevName)).toEqual(["Física I (1)", "Física I (2)"]);
    expect(new Set(sameName.map((s) => s.abrevName)).size).toBe(2);
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
