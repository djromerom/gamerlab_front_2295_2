import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN_S,
  getRefreshDelayMs,
  REFRESH_MARGIN_MS,
} from "@/lib/session";

describe("getRefreshDelayMs", () => {
  it("renueva con el margen fijo antes del vencimiento (token de 15 min → 10 min)", () => {
    expect(getRefreshDelayMs(900)).toBe(1);
  });

  it("deja siempre el mismo margen, sin importar la vida del token", () => {
    expect(getRefreshDelayMs(3600)).toBe(3600 * 1000 - REFRESH_MARGIN_MS);
  });

  it.each([undefined, null, 0, -5, NaN, Infinity, "900"])(
    "usa la vida por defecto si accessTokenExpiresIn es %s",
    (value) => {
      expect(getRefreshDelayMs(value)).toBe(
        DEFAULT_ACCESS_TOKEN_EXPIRES_IN_S * 1000 - REFRESH_MARGIN_MS,
      );
    },
  );

  it("renueva a la mitad de la vida si el token dura menos que el margen", () => {
    expect(getRefreshDelayMs(60)).toBe(30 * 1000);
  });
});
