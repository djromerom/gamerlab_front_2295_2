import { describe, expect, it } from "vitest";
import { FREE_LANES, LEVEL_DRUMS, LEVELS, SONGS, lanesFor, type Instrument } from "./songs";
import { parseChord } from "./accompaniment";

const INSTRUMENTOS: Instrument[] = ["guitarra", "piano", "bateria"];
const tiempos = (notas: number[][]) => notas.reduce((total, [, d]) => total + d, 0);

describe("repertorio de Arkad Jam", () => {
  it.each(INSTRUMENTOS)("%s tiene 3 canciones por dificultad (Fácil, Medio, Difícil y Extremo)", (instrumento) => {
    for (const nivel of [1, 2, 3, 4]) {
      expect(SONGS[instrumento].filter((c) => c.nivel === nivel)).toHaveLength(3);
    }
  });

  it("cada canción tiene nombre, autor, tempo y notas con duración positiva", () => {
    for (const instrumento of INSTRUMENTOS) {
      for (const c of SONGS[instrumento]) {
        expect(c.nombre.length).toBeGreaterThan(0);
        expect(c.autor.length).toBeGreaterThan(0);
        expect(c.bpm).toBeGreaterThan(40);
        expect(c.notas.length).toBeGreaterThan(8);
        for (const [, dur] of c.notas) expect(dur).toBeGreaterThan(0);
      }
    }
  });

  it("toda nota cae en uno de los carriles de su dificultad", () => {
    for (const instrumento of INSTRUMENTOS) {
      for (const c of SONGS[instrumento]) {
        const { carriles, carrilDe } = lanesFor(c, instrumento);
        expect(carriles).toHaveLength(LEVELS[c.nivel].carriles);
        for (const [alto] of c.notas) {
          if (alto === null) continue;
          const carril = carrilDe(alto);
          expect(carril, `${instrumento} · ${c.nombre} · altura ${alto}`).toBeGreaterThanOrEqual(0);
          expect(carril).toBeLessThan(carriles.length);
        }
      }
    }
  });

  it("la batería solo usa las piezas de su dificultad", () => {
    for (const c of SONGS.bateria) {
      const piezas = LEVEL_DRUMS[LEVELS[c.nivel].carriles];
      for (const [pieza] of c.notas) if (pieza !== null) expect(piezas, `${c.nombre}: pieza ${pieza}`).toContain(pieza);
    }
  });

  it("los acordes se pueden leer y la melodía de fondo dura lo mismo que el ritmo", () => {
    for (const instrumento of INSTRUMENTOS) {
      for (const c of SONGS[instrumento]) {
        for (const [nombre, largo] of c.acordes ?? []) {
          expect(() => parseChord(nombre), `${c.nombre}: ${nombre}`).not.toThrow();
          expect(largo).toBeGreaterThan(0);
        }
        if (c.tema) expect(Math.abs(tiempos(c.tema) - tiempos(c.notas)), c.nombre).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("carriles del modo libre", () => {
  it("guitarra y batería tienen 8 notas con las teclas 1 a 8", () => {
    for (const instrumento of ["guitarra", "bateria"] as const) {
      expect(FREE_LANES[instrumento].map((c) => c.tecla)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
    }
  });

  it("el piano suma los 5 semitonos con las teclas Q, W, R, T e Y", () => {
    const negras = FREE_LANES.piano.filter((c) => c.negra);
    expect(FREE_LANES.piano).toHaveLength(13);
    expect(negras.map((c) => c.tecla)).toEqual(["Q", "W", "R", "T", "Y"]);
  });
});
