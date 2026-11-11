import { describe, expect, it } from "vitest";
import {
  bogotaToISO,
  formatEditionDate,
  formatEditionTime,
  isoToBogotaDate,
  isoToBogotaTime,
} from "./editionDate";

// Las pruebas deben dar lo mismo en cualquier zona del sistema (TZ=UTC, Asia/Tokyo, etc.).

describe("formatEditionDate", () => {
  it("usa el formato de «Información»: día de la semana, día y mes con la primera en mayúscula", () => {
    expect(formatEditionDate("2026-05-14T12:00:00.000Z")).toBe("Jueves 14 de mayo");
  });

  it("agrega el año cuando se pide (ediciones pasadas)", () => {
    expect(formatEditionDate("2025-05-15T12:00:00.000Z", { withYear: true })).toBe(
      "Jueves 15 de mayo de 2025",
    );
  });

  it("devuelve «Por Definir» sin fecha y «Fecha Inválida» con fecha mala", () => {
    expect(formatEditionDate(undefined)).toBe("Por Definir");
    expect(formatEditionDate("xx")).toBe("Fecha Inválida");
  });

  it("muestra el día de Bogotá aunque en UTC ya sea el día siguiente", () => {
    // 9:00 p. m. del jueves 27 en Bogotá = 02:00 UTC del viernes 28
    expect(formatEditionDate("2025-11-28T02:00:00.000Z")).toBe("Jueves 27 de noviembre");
  });
});

describe("formatEditionTime", () => {
  it("muestra la hora de Bogotá (edición 2025 - S2: 8:30 a. m. a 12:30 p. m.)", () => {
    expect(formatEditionTime("2025-11-27T13:30:00.000Z")).toBe("08:30 am");
    expect(formatEditionTime("2025-11-27T17:30:00.000Z")).toBe("12:30 pm");
  });

  it("devuelve «--:--» sin hora o con hora mala", () => {
    expect(formatEditionTime(undefined)).toBe("--:--");
    expect(formatEditionTime("xx")).toBe("--:--");
  });
});

describe("hora de Bogotá en el formulario de ediciones", () => {
  it("convierte la hora ingresada en Bogotá a UTC", () => {
    expect(bogotaToISO("2025-11-27", "08:30")).toBe("2025-11-27T13:30:00.000Z");
    expect(bogotaToISO("2025-11-27", "12:30")).toBe("2025-11-27T17:30:00.000Z");
    expect(bogotaToISO("2025-11-27", "21:00")).toBe("2025-11-28T02:00:00.000Z");
  });

  it("lee fecha y hora en Bogotá", () => {
    expect(isoToBogotaDate("2025-11-27T13:30:00.000Z")).toBe("2025-11-27");
    expect(isoToBogotaTime("2025-11-27T13:30:00.000Z")).toBe("08:30");
    expect(isoToBogotaDate("2025-11-28T02:00:00.000Z")).toBe("2025-11-27");
    expect(isoToBogotaTime("2025-11-28T02:00:00.000Z")).toBe("21:00");
    expect(isoToBogotaTime("2025-11-27T05:00:00.000Z")).toBe("00:00");
  });

  it("abrir y guardar sin cambios conserva las horas", () => {
    const startsAt = "2026-05-28T13:00:00.000Z";
    const endsAt = "2026-05-28T17:30:00.000Z";
    const date = isoToBogotaDate(startsAt);
    expect(bogotaToISO(date, isoToBogotaTime(startsAt))).toBe(startsAt);
    expect(bogotaToISO(date, isoToBogotaTime(endsAt))).toBe(endsAt);
  });

  it("vacíos e inválidos", () => {
    expect(isoToBogotaDate("")).toBe("");
    expect(isoToBogotaTime("")).toBe("");
    expect(isoToBogotaDate("xx")).toBe("xx");
  });
});
