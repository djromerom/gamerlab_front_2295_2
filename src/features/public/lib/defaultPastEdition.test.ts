import { describe, expect, it } from "vitest";
import { pickDefaultPastEdition } from "./defaultPastEdition";

const now = new Date("2026-11-17T15:00:00.000Z");

const edition = (id: number, startsAt: string, endsAt: string) => ({ id, startsAt, endsAt });

const prueba2027 = edition(9, "2027-05-20T13:00:00.000Z", "2027-05-20T22:00:00.000Z");
const feria2025S2 = edition(4, "2025-11-27T13:30:00.000Z", "2025-11-27T17:30:00.000Z");
const feria2026S1 = edition(6, "2026-05-14T13:00:00.000Z", "2026-05-14T22:00:00.000Z");
const feria2025S1 = edition(2, "2025-05-15T13:00:00.000Z", "2025-05-15T22:00:00.000Z");

describe("pickDefaultPastEdition (ARK-248)", () => {
  it("abre la edición que terminó más recientemente, no una de prueba con fecha futura", () => {
    expect(pickDefaultPastEdition([prueba2027, feria2025S2, feria2026S1, feria2025S1], now)).toBe(feria2026S1);
  });

  it("no depende del orden en que llegan las ediciones", () => {
    expect(pickDefaultPastEdition([feria2025S1, feria2026S1, feria2025S2], now)).toBe(feria2026S1);
  });

  it("una edición que termina justo ahora o después no cuenta como terminada", () => {
    const enCurso = edition(7, "2026-11-17T13:00:00.000Z", "2026-11-17T15:00:00.000Z");
    expect(pickDefaultPastEdition([enCurso, feria2025S2], now)).toBe(feria2025S2);
  });

  it("si ninguna terminó, abre la que está en curso", () => {
    const enCurso = edition(7, "2026-11-17T13:00:00.000Z", "2026-11-17T22:00:00.000Z");
    expect(pickDefaultPastEdition([prueba2027, enCurso], now)).toBe(enCurso);
  });

  it("si todas son futuras o no hay ediciones, no abre ninguna", () => {
    expect(pickDefaultPastEdition([prueba2027], now)).toBeNull();
    expect(pickDefaultPastEdition([], now)).toBeNull();
  });
});
