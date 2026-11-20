import { describe, expect, it } from "vitest";
import {
  apiErrorMessage,
  findMissingCriteria,
  formatCriterionScore,
  missingCriteriaMessage,
  parseCriterionScore,
} from "@/features/grading/lib/criteriaScores";

const criterion = (id: number, score: string | number, name = `Criterio ${id}`) => ({ id, name, score, maxScore: 5 });

describe("parseCriterionScore", () => {
  it("un vacío no es un 0", () => {
    expect(parseCriterionScore("", 5)).toBeNull();
    expect(parseCriterionScore("   ", 5)).toBeNull();
    expect(parseCriterionScore(null, 5)).toBeNull();
    expect(parseCriterionScore(undefined, 5)).toBeNull();
    expect(parseCriterionScore(".", 5)).toBeNull();
  });

  it("un 0 escrito a mano sí es un puntaje", () => {
    expect(parseCriterionScore("0", 5)).toBe(0);
    expect(parseCriterionScore("0.0", 5)).toBe(0);
    expect(parseCriterionScore(0, 5)).toBe(0);
  });

  it("acepta coma decimal y se queda en el rango 0-5", () => {
    expect(parseCriterionScore("3,5", 5)).toBe(3.5);
    expect(parseCriterionScore("7", 5)).toBe(5);
    expect(parseCriterionScore("-1", 5)).toBe(0);
  });
});

describe("findMissingCriteria", () => {
  it("devuelve en orden los criterios vacíos y no cuenta el 0 como vacío", () => {
    const criteria = [criterion(1, "4"), criterion(2, ""), criterion(3, "0"), criterion(4, " ")];
    expect(findMissingCriteria(criteria).map((c) => c.id)).toEqual([2, 4]);
  });

  it("sin vacíos no falta nada", () => {
    expect(findMissingCriteria([criterion(1, "0"), criterion(2, 5)])).toEqual([]);
  });
});

describe("missingCriteriaMessage", () => {
  it("nombra lo que falta", () => {
    expect(missingCriteriaMessage([{ name: "Jugabilidad" }])).toBe(
      "Califica todos los criterios antes de enviar. Falta: «Jugabilidad».",
    );
    expect(missingCriteriaMessage([{ name: "Arte" }, { name: "Sonido" }])).toBe(
      "Califica todos los criterios antes de enviar. Faltan: «Arte», «Sonido».",
    );
    expect(missingCriteriaMessage([])).toBe("");
  });
});

describe("formatCriterionScore", () => {
  it("muestra «—» si está vacío, para no confundirlo con 0.00", () => {
    expect(formatCriterionScore("", 5)).toBe("—");
    expect(formatCriterionScore("0", 5)).toBe("0.00");
    expect(formatCriterionScore("4.5", 5)).toBe("4.50");
  });
});

describe("apiErrorMessage", () => {
  it("lee el 400 de puntajes nulos del back (ARK-250) sin la ruta del campo", () => {
    const body = {
      message: [
        "details.0.Cada puntaje debe ser un número entre 0 y 5: no puede ser nulo, vacío ni texto. Un 0 debe enviarse de forma explícita.",
        "details.3.Cada puntaje debe ser un número entre 0 y 5: no puede ser nulo, vacío ni texto. Un 0 debe enviarse de forma explícita.",
      ],
      error: "Bad Request",
      statusCode: 400,
    };
    expect(apiErrorMessage(body, "x")).toBe(
      "Cada puntaje debe ser un número entre 0 y 5: no puede ser nulo, vacío ni texto. Un 0 debe enviarse de forma explícita.",
    );
  });

  it("quita la ruta anidada del lote", () => {
    expect(apiErrorMessage({ message: ["evaluations.1.details.0.Puntaje inválido"] }, "x")).toBe("Puntaje inválido");
  });

  it("deja igual un mensaje de texto y usa el respaldo si no hay mensaje", () => {
    expect(apiErrorMessage({ message: "Este grupo no está asignado al evaluador" }, "x")).toBe(
      "Este grupo no está asignado al evaluador",
    );
    expect(apiErrorMessage({}, "Error al guardar")).toBe("Error al guardar");
    expect(apiErrorMessage(null, "Error al guardar")).toBe("Error al guardar");
  });
});
