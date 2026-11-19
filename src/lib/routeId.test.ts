import { describe, expect, it } from "vitest";
import { parseRouteId } from "./routeId";

describe("parseRouteId (BG-66)", () => {
  it("acepta enteros positivos", () => {
    expect(parseRouteId("12")).toBe(12);
    expect(parseRouteId(" 7 ")).toBe(7);
  });

  it("rechaza lo que no es un id, sin convertirlo en NaN", () => {
    for (const value of ["abc", "12abc", "1e3", "-4", "0", "1.5", "", undefined, null]) {
      expect(parseRouteId(value)).toBeNull();
    }
  });
});
