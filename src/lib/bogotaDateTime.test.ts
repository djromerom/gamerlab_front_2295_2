import { describe, expect, it } from "vitest";
import {
  compareInstantsDesc,
  formatBogotaDateTime,
  isPastInstant,
  isSameBogotaDay,
} from "@/lib/bogotaDateTime";

// Las 10:00 a. m. del 16-nov en Bogotá (UTC-5).
const NOW = "2026-11-16T15:00:00.000Z";

describe("formatBogotaDateTime (ARK-261)", () => {
  it("si es de hoy en Bogotá muestra solo la hora", () => {
    const text = formatBogotaDateTime("2026-11-16T13:05:00.000Z", NOW);
    expect(text).toMatch(/^8:05/);
    expect(text).not.toContain("/");
  });

  it("si es de otro día muestra día, mes y hora", () => {
    // 05:17 UTC del 11-nov = 12:17 a. m. del 11-nov en Bogotá
    const text = formatBogotaDateTime("2026-11-11T05:17:00.000Z", NOW);
    expect(text).toMatch(/^11\/11, 12:17/);
    expect(text).toMatch(/a\.\s?m\./);
  });

  it("usa el día de Bogotá y no el de UTC: 00:30 UTC del 17-nov sigue siendo el 16-nov", () => {
    // 00:30 UTC del 17-nov = 7:30 p. m. del 16-nov en Bogotá → hoy
    expect(formatBogotaDateTime("2026-11-17T00:30:00.000Z", NOW)).toMatch(/^7:30/);
    // 00:30 UTC del 16-nov = 7:30 p. m. del 15-nov en Bogotá → otro día, aunque en UTC sea hoy
    expect(formatBogotaDateTime("2026-11-16T00:30:00.000Z", NOW)).toMatch(/^15\/11, 7:30/);
  });

  it("el «hoy» se toma de la referencia, también cuando ella cruza la medianoche UTC", () => {
    // Referencia: 00:30 UTC del 17-nov = 16-nov en Bogotá
    expect(formatBogotaDateTime("2026-11-16T13:05:00.000Z", "2026-11-17T00:30:00.000Z")).toMatch(/^8:05/);
  });

  it("sin valor o con un valor inválido devuelve una raya", () => {
    expect(formatBogotaDateTime(null, NOW)).toBe("—");
    expect(formatBogotaDateTime("no-es-fecha", NOW)).toBe("—");
  });
});

describe("isSameBogotaDay e isPastInstant", () => {
  it("compara el día calendario de Bogotá", () => {
    expect(isSameBogotaDay("2026-11-17T04:59:00.000Z", NOW)).toBe(true);
    expect(isSameBogotaDay("2026-11-17T05:00:00.000Z", NOW)).toBe(false);
  });

  it("dice si un instante ya pasó", () => {
    expect(isPastInstant("2026-11-11T05:17:00.000Z", NOW)).toBe(true);
    expect(isPastInstant(NOW, NOW)).toBe(true);
    expect(isPastInstant("2026-11-16T15:01:00.000Z", NOW)).toBe(false);
    expect(isPastInstant(null, NOW)).toBe(false);
  });
});

describe("compareInstantsDesc", () => {
  it("ordena por fecha y hora completas, el más reciente primero y los vacíos al final", () => {
    const values = [
      "2026-11-06T22:00:00.000Z", // 06/11, 5:00 p. m.
      null,
      "2026-11-11T05:17:00.000Z", // 11/11, 12:17 a. m.
      "2026-11-16T13:05:00.000Z", // hoy, 8:05 a. m.
    ];
    expect([...values].sort(compareInstantsDesc)).toEqual([
      "2026-11-16T13:05:00.000Z",
      "2026-11-11T05:17:00.000Z",
      "2026-11-06T22:00:00.000Z",
      null,
    ]);
  });
});
