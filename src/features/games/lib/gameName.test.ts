import { describe, expect, it } from "vitest";
import { stripTeamCodePrefix } from "./gameName";

describe("stripTeamCodePrefix (BG-66)", () => {
  it("quita el código del propio equipo y el separador", () => {
    expect(stripTeamCodePrefix("N1-ABC-1001 - Ruta 66", "N1-ABC-1001")).toBe("Ruta 66");
    expect(stripTeamCodePrefix("[N3-POO-12] Byte Club", "N3-POO-12")).toBe("Byte Club");
    expect(stripTeamCodePrefix("n2-edd-7: Pixel", "N2-EDD-7")).toBe("Pixel");
  });

  it("quita un código con forma de la feria aunque no sea el del equipo", () => {
    expect(stripTeamCodePrefix("N10-ABC-1002 Galaxia", "")).toBe("Galaxia");
  });

  it("no toca nombres sin código ni deja el nombre vacío", () => {
    expect(stripTeamCodePrefix("Ruta 66", "N1-ABC-1001")).toBe("Ruta 66");
    expect(stripTeamCodePrefix("N1 Racing", "N1-ABC-1001")).toBe("N1 Racing");
    expect(stripTeamCodePrefix("N1-ABC-1001", "N1-ABC-1001")).toBe("N1-ABC-1001");
    expect(stripTeamCodePrefix(undefined)).toBe("");
  });
});
