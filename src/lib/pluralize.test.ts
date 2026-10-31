import { describe, expect, it } from "vitest";
import { editionsCountLabel } from "./pluralize";

describe("editionsCountLabel", () => {
  it("usa «edición» en singular y «ediciones» en plural, sin tilde en el plural", () => {
    expect(editionsCountLabel(1)).toBe("Mostrando 1 edición registrada");
    expect(editionsCountLabel(4)).toBe("Mostrando 4 ediciones registradas");
    expect(editionsCountLabel(0)).toBe("Mostrando 0 ediciones registradas");
  });
});
