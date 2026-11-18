import { describe, expect, it } from "vitest";
import { formatDate, getApiErrorMessage, toJurorRow, type JurorRowData } from "./utils";

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

  it("ARK-244: muestra la hora de Bogotá (UTC-5), no la del navegador", () => {
    expect(formatDate("2026-11-16T18:39:54.423Z")).toBe("16/11/2026, 13:39");
    // 02:00 UTC todavía es el día anterior en Bogotá
    expect(formatDate("2026-11-17T02:00:00.000Z")).toBe("16/11/2026, 21:00");
  });
});

describe("toJurorRow (ARK-244)", () => {
  const raw = {
    id: "j-1",
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana@test.com",
    confirmationStatusId: 2,
    lastSignInAt: "2026-11-16T18:39:54.423Z",
    evaluatedCount: 0,
    evaluatedGameNames: [],
    unevaluatedCount: 3,
    unevaluatedGameNames: [],
  } satisfies JurorRowData;

  it("deja el estado legible y la última conexión en hora de Bogotá, sin tocar el resto", () => {
    expect(toJurorRow(raw)).toEqual({
      ...raw,
      confirmationStatusId: "Pendiente",
      lastSignInAt: "16/11/2026, 13:39",
    });
  });

  it("muestra «Nunca» si el jurado no se ha conectado", () => {
    expect(toJurorRow({ ...raw, lastSignInAt: null }).lastSignInAt).toBe("Nunca");
  });

  it("no vuelve a mapear un estado que ya es texto", () => {
    expect(toJurorRow({ ...raw, confirmationStatusId: "Confirmado" }).confirmationStatusId).toBe("Confirmado");
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
