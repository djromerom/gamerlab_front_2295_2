import { describe, expect, it } from "vitest";
import { getBatchBackRoute } from "./batchRoute";

describe("getBatchBackRoute (/calificar-lote)", () => {
  it("el Profesor vuelve a los colegios, aunque no venga el origen", () => {
    expect(getBatchBackRoute(undefined, "Profesor")).toBe("/colegios-calificar");
    expect(getBatchBackRoute("jurado", "Profesor")).toBe("/colegios-calificar");
  });

  it("el Jurado vuelve a sus pendientes", () => {
    expect(getBatchBackRoute(undefined, "Jurado")).toBe("/pendientes-calificar");
    expect(getBatchBackRoute("colegios", "Jurado")).toBe("/pendientes-calificar");
  });

  it("sin rol conocido usa el origen", () => {
    expect(getBatchBackRoute("colegios", null)).toBe("/colegios-calificar");
    expect(getBatchBackRoute(undefined, null)).toBe("/pendientes-calificar");
  });
});
