import { describe, expect, it } from "vitest";
import { formatDate, getApiErrorMessage } from "./utils";

describe("formatDate (Última conexión)", () => {
  it("muestra «Nunca» si lastSignInAt es null, vacío o inválido", () => {
    expect(formatDate(null)).toBe("Nunca");
    expect(formatDate(undefined)).toBe("Nunca");
    expect(formatDate("")).toBe("Nunca");
    expect(formatDate("no-es-fecha")).toBe("Nunca");
  });

  it("formatea una fecha válida", () => {
    expect(formatDate("2026-10-30T15:30:00.000Z")).not.toBe("Nunca");
  });
});

describe("getApiErrorMessage", () => {
  it("devuelve el mensaje si el backend responde un string", () => {
    expect(getApiErrorMessage({ message: "El correo ya existe" }, "fallback")).toBe("El correo ya existe");
  });

  it("une los mensajes de validación si el backend responde una lista", () => {
    expect(
      getApiErrorMessage(
        { message: ["La categoría del jurado es obligatoria", "El tipo de jurado es obligatorio"] },
        "fallback",
      ),
    ).toBe("La categoría del jurado es obligatoria. El tipo de jurado es obligatorio");
  });

  it("usa el mensaje por defecto si no hay cuerpo o mensaje", () => {
    expect(getApiErrorMessage(null, "fallback")).toBe("fallback");
    expect(getApiErrorMessage({}, "fallback")).toBe("fallback");
    expect(getApiErrorMessage({ message: [] }, "fallback")).toBe("fallback");
  });
});
