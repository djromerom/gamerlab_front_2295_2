import { describe, expect, it } from "vitest";
import { formatDate } from "./utils";

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
