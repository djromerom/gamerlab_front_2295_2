import { afterEach, describe, expect, it } from "vitest";
import { VOLUME_KEY, savedVolume } from "./mountMiniGames";

afterEach(() => localStorage.clear());

describe("savedVolume", () => {
  it("sin volumen guardado empieza en 80 %", () => {
    expect(savedVolume()).toBe(0.8);
  });

  it("devuelve el volumen guardado entre visitas", () => {
    localStorage.setItem(VOLUME_KEY, "0.35");
    expect(savedVolume()).toBe(0.35);
  });

  it("acota valores fuera de rango y descarta los que no son números", () => {
    localStorage.setItem(VOLUME_KEY, "4");
    expect(savedVolume()).toBe(1);
    localStorage.setItem(VOLUME_KEY, "-1");
    expect(savedVolume()).toBe(0);
    localStorage.setItem(VOLUME_KEY, "mucho");
    expect(savedVolume()).toBe(0.8);
  });
});
