import { describe, expect, it } from "vitest";
import {
  blockedReason,
  canCombine,
  combinationHint,
  COMBINATION_HINT,
  SINGLE_SUBJECT_HINT,
  invalidCombination,
  membersWithoutSharedSubject,
  subjectFamilies,
} from "@/features/teams/lib/subjectRules";

const option = (id: number, name: string, abrevName: string) => ({
  code: `${id}01`,
  subjectId: id,
  subject: { id, name, abrevName },
});
const subject = (id: number, name: string) => ({ id: String(id), name, abrevName: name });

// Catálogo de Arkad-test
const TEST_OPTIONS = [
  option(2, "Algoritmia y Programación I", "AYP"),
  option(3, "Algoritmia y Programación II", "AYP"),
  option(4, "Programación Orientada a Objetos", "POO"),
  option(5, "Estructuras de Datos I", "EDD"),
  option(1, "Estructuras de Datos II", "EDD"),
  option(6, "Colegios", "COL"),
];
const families = subjectFamilies(TEST_OPTIONS);
const AYP1 = subject(2, "Algoritmia y Programación I");
const AYP2 = subject(3, "Algoritmia y Programación II");
const POO = subject(4, "Programación Orientada a Objetos");
const EDD1 = subject(5, "Estructuras de Datos I");
const EDD2 = subject(1, "Estructuras de Datos II");
const COL = subject(6, "Colegios");

describe("materias que un integrante puede marcar juntas (ARK-193)", () => {
  it.each([
    [POO, EDD1],
    [POO, EDD2],
    [EDD2, POO],
  ])("%s.name con %s.name sí", (a, b) => {
    expect(canCombine(a, b, families)).toBe(true);
  });

  it.each([
    [AYP1, AYP2],
    [AYP1, POO],
    [AYP1, EDD1],
    [AYP1, EDD2],
    [AYP2, POO],
    [AYP2, EDD1],
    [EDD1, EDD2],
    [COL, POO],
  ])("%s.name con %s.name no", (a, b) => {
    expect(canCombine(a, b, families)).toBe(false);
  });

  it("se guía por la abreviatura aunque el nombre sea otro", () => {
    const local = subjectFamilies([
      option(2, "AyP1", "AYP"),
      option(5, "Estructura de Datos 1", "EDD"),
      option(6, "Programación Orientada a Objetos", "POO"),
    ]);
    expect(canCombine(subject(6, "POO"), subject(5, "Estructura de Datos 1"), local)).toBe(true);
    expect(canCombine(subject(2, "AyP1"), subject(6, "POO"), local)).toBe(false);
  });

  it("sin abreviatura conocida reconoce la materia por el nombre", () => {
    const byName = subjectFamilies([
      option(7, "PROGRAMACION orientada a objetos", "IST"),
      option(8, "Estructura de datos II", "IST"),
    ]);
    expect(canCombine(subject(7, "POO"), subject(8, "EDD II"), byName)).toBe(true);
  });

  it("explica por qué una materia no se puede marcar", () => {
    expect(blockedReason([AYP1], POO, families)).toContain("Algoritmia y Programación I");
    expect(blockedReason([POO], EDD2, families)).toBeNull();
    expect(blockedReason([], AYP1, families)).toBeNull();
  });

  it("encuentra la combinación inválida que llega de un borrador", () => {
    expect(invalidCombination([POO, EDD1], families)).toBeNull();
    expect(invalidCombination([POO, EDD1, EDD2], families)).toEqual([EDD1, EDD2]);
  });
});

describe("cada integrante comparte una materia con los anteriores (ARK-193)", () => {
  it("acepta un equipo encadenado por materia", () => {
    // 1: EDD I + POO · 2: solo POO · 3: POO + EDD II
    expect(membersWithoutSharedSubject([["5", "4"], ["4"], ["4", "1"]])).toEqual([]);
  });

  it("señala a quien no comparte ninguna", () => {
    // 1: POO · 2: EDD II · 3: POO
    expect(membersWithoutSharedSubject([["4"], ["1"], ["4"]])).toEqual([1]);
  });

  it("no exige nada a quien todavía no tiene materias", () => {
    expect(membersWithoutSharedSubject([["4"], []])).toEqual([]);
  });
});

describe("ayuda de combinación según las materias ofrecidas (BG-66)", () => {
  it("nombra POO y Estructura de Datos solo si las dos se ofrecen", () => {
    expect(combinationHint(families)).toBe(COMBINATION_HINT);
  });

  it("sin Estructura de Datos en la edición no la menciona", () => {
    const sinEdd = subjectFamilies(TEST_OPTIONS.filter((o) => o.subject.abrevName !== "EDD"));
    expect(combinationHint(sinEdd)).toBe(SINGLE_SUBJECT_HINT);
    expect(blockedReason([AYP1], POO, sinEdd)).not.toContain("Estructura");
  });
});
