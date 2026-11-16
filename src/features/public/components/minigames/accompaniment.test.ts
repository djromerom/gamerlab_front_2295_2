import { describe, expect, it } from "vitest";
import { accompaniment, parseChord } from "./accompaniment";
import type { Song } from "./songs";

const base: Song = { nombre: "Prueba", autor: "Test", bpm: 120, nivel: 1, estilo: "vals", notas: [[0, 4], [4, 4]] };

describe("parseChord", () => {
  it("lee la raíz con alteraciones y la calidad del acorde", () => {
    expect(parseChord("C")).toEqual({ r: 0, iv: [0, 4, 7] });
    expect(parseChord("F#m")).toEqual({ r: 6, iv: [0, 3, 7] });
    expect(parseChord("Bb")).toEqual({ r: 10, iv: [0, 4, 7] });
    expect(parseChord("G7")).toEqual({ r: 7, iv: [0, 4, 7, 10] });
    expect(parseChord("Em7")).toEqual({ r: 4, iv: [0, 3, 7, 10] });
  });
});

describe("accompaniment", () => {
  it("la guitarra lleva piano de fondo y el piano lleva guitarra", () => {
    const def = { ...base, acordes: [["C", 4], ["G", 4]] } as Song;
    expect(new Set(accompaniment(def, "guitarra", 8).map((e) => e.tipo))).toEqual(new Set(["piano"]));
    expect(new Set(accompaniment(def, "piano", 8).map((e) => e.tipo))).toEqual(new Set(["guitarra"]));
  });

  it("ninguna nota de fondo empieza después del final de la canción", () => {
    const def = { ...base, estilo: "arpegio", acordes: [["Am", 3], ["E7", 3]] } as Song;
    const eventos = accompaniment(def, "guitarra", 10);
    expect(eventos.length).toBeGreaterThan(0);
    for (const e of eventos) expect(e.beat).toBeLessThan(10);
  });

  it("los acordes se repiten si la canción es más larga que su lista", () => {
    const def = { ...base, estilo: "bloque", acordes: [["C", 2]] } as Song;
    const bajos = accompaniment(def, "guitarra", 8).filter((e) => e.vol === 1).map((e) => e.beat);
    expect(bajos).toEqual([0, 2, 4, 6]);
  });

  it("en la batería con melodía suena la melodía y un piano seco de fondo (estilo banda)", () => {
    const def = { ...base, estilo: "banda", acordes: [["C", 4]], tema: [[12, 1], [null, 1], [14, 2]] } as Song;
    const eventos = accompaniment(def, "bateria", 4);
    expect(eventos.filter((e) => e.tipo === "melodia").map((e) => [e.alto, e.beat])).toEqual([[12, 0], [14, 2]]);
    expect(eventos.filter((e) => e.tipo !== "melodia").every((e) => e.tipo === "pianoSeco")).toBe(true);
  });

  it("una canción con acompañamiento propio usa el suyo", () => {
    const propio = [{ tipo: "cuerdas" as const, alto: 0, beat: 0, dur: 4, vol: 1, retraso: 0 }];
    expect(accompaniment({ ...base, fondo: () => propio }, "piano", 8)).toBe(propio);
  });

  it("sin acordes no hay acompañamiento", () => {
    expect(accompaniment(base, "guitarra", 8)).toEqual([]);
  });
});
