import { describe, expect, it } from "vitest";
import {
  AssignmentWarningsError,
  getAssignmentWarnings,
  isValidationUnavailable,
} from "@/lib/assignmentWarnings";

const overLimit = {
  code: "JUROR_OVER_LIMIT",
  message: "El jurado senior Luis Gómez quedaría con 4 grupos; el máximo recomendado es 3 por jurado.",
  jurorId: "d4e5f6a7",
  details: { teams: 4, maximum: 3, teamIds: [2, 5, 7, 9] },
};

describe("getAssignmentWarnings", () => {
  it("devuelve las advertencias de un 409 ASSIGNMENT_WARNINGS", () => {
    const body = {
      statusCode: 409,
      code: "ASSIGNMENT_WARNINGS",
      message: "La asignación rompe reglas de asignación...",
      warnings: [overLimit],
    };

    expect(getAssignmentWarnings(409, body)).toEqual([overLimit]);
  });

  it("el 409 por jurado duplicado no es una advertencia (no trae el code)", () => {
    const body = {
      statusCode: 409,
      message: "El evaluador ya está asignado a este equipo.",
    };

    expect(getAssignmentWarnings(409, body)).toBeNull();
  });

  it("un bloqueo 400 no es una advertencia aunque traiga el code", () => {
    expect(
      getAssignmentWarnings(400, { code: "ASSIGNMENT_WARNINGS", warnings: [overLimit] })
    ).toBeNull();
  });

  it("ignora cuerpos que no son objeto y advertencias sin mensaje", () => {
    expect(getAssignmentWarnings(409, "Conflict")).toBeNull();
    expect(getAssignmentWarnings(409, null)).toBeNull();
    expect(
      getAssignmentWarnings(409, {
        code: "ASSIGNMENT_WARNINGS",
        warnings: [overLimit, { code: "NRC_CONFLICT" }, null],
      })
    ).toEqual([overLimit]);
  });
});

describe("isValidationUnavailable", () => {
  it("detecta cuando el back no pudo comprobar las reglas", () => {
    expect(
      isValidationUnavailable([
        overLimit,
        { code: "VALIDATION_UNAVAILABLE", message: "No se pudieron comprobar las reglas." },
      ])
    ).toBe(true);
    expect(isValidationUnavailable([overLimit])).toBe(false);
  });
});

describe("AssignmentWarningsError", () => {
  it("conserva el mensaje y las advertencias", () => {
    const error = new AssignmentWarningsError("Confirma para continuar", [overLimit]);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Confirma para continuar");
    expect(error.warnings).toEqual([overLimit]);
  });
});
