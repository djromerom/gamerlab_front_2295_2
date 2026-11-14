import { describe, expect, it } from "vitest";
import { interpretWeightsResponse } from "./weightsResponse";

describe("interpretWeightsResponse (ARK-130)", () => {
  it("200 con ponderados", () => {
    expect(interpretWeightsResponse(200, { seniorPct: 60, juniorPct: 40 })).toEqual({
      kind: "loaded",
      seniorPct: 60,
      juniorPct: 40,
    });
  });

  it("sin edición activa muestra el mensaje del back", () => {
    expect(
      interpretWeightsResponse(404, { code: "NO_ACTIVE_EDITION", message: "No hay una edición activa." }),
    ).toEqual({ kind: "no-active-edition", message: "No hay una edición activa." });
  });

  it("la edición activa aún sin ponderados deja los campos vacíos", () => {
    expect(interpretWeightsResponse(404, { code: "WEIGHTS_NOT_CONFIGURED", message: "x" })).toEqual({ kind: "empty" });
  });

  it("un cuerpo vacío o un error inesperado no rompen la página", () => {
    expect(interpretWeightsResponse(200, null)).toEqual({ kind: "empty" });
    expect(interpretWeightsResponse(500, null)).toEqual({
      kind: "error",
      message: "No se pudieron cargar los porcentajes (error 500).",
    });
  });
});
