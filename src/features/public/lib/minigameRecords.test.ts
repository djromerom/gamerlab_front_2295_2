import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALIAS_INVALID_MESSAGE,
  ALIAS_PERSONAL_DATA_MESSAGE,
  MINIGAME_FINISHED_EVENT,
  aliasProblem,
  announceMinigameFinished,
  jamTrack,
  normalizeAlias,
  parseJamTrack,
  qualifiesForTop,
} from "./minigameRecords";

const top = (...puntajes: number[]) => puntajes.map((score) => ({ score }));

describe("aliasProblem", () => {
  it("acepta de 3 a 12 letras o números, con tildes, espacio, punto y guiones", () => {
    for (const alias of ["Pix", "Nova_99", "José Ñ.", "a-b-c", "DoceLetrasXY"]) expect(aliasProblem(alias)).toBeNull();
  });

  it("rechaza alias cortos, largos o con símbolos", () => {
    for (const alias of ["Pi", "  ab  ", "TreceLetrasXY", "hola!", "<b>x</b>", ""]) expect(aliasProblem(alias)).toBe(ALIAS_INVALID_MESSAGE);
  });

  it("rechaza códigos, documentos y teléfonos", () => {
    for (const alias of ["Ana 200123", "300 123 4567", "1.234.567"]) expect(aliasProblem(alias)).toBe(ALIAS_PERSONAL_DATA_MESSAGE);
  });

  it("cuenta el largo como el back: sin espacios de los bordes y con los repetidos unidos", () => {
    expect(normalizeAlias("  Pixel   Nova ")).toBe("Pixel Nova");
    expect(aliasProblem("   Pixel   ")).toBeNull();
  });
});

describe("qualifiesForTop", () => {
  it("con menos de 5 récords entra cualquier puntaje posible", () => {
    expect(qualifiesForTop("ARKADASH", [], 1)).toBe(true);
    expect(qualifiesForTop("ARKAD_JAM", top(900, 800), 10)).toBe(true);
  });

  it("con el top lleno hay que superar al quinto (un empate no entra)", () => {
    const lleno = top(50, 40, 30, 20, 10);
    expect(qualifiesForTop("ARKADASH", lleno, 11)).toBe(true);
    expect(qualifiesForTop("ARKADASH", lleno, 10)).toBe(false);
    expect(qualifiesForTop("ARKADASH", lleno, 3)).toBe(false);
  });

  it("no ofrece guardar puntajes en cero ni por encima del tope del juego", () => {
    expect(qualifiesForTop("ARKADASH", [], 0)).toBe(false);
    expect(qualifiesForTop("ARKADASH", [], 10_001)).toBe(false);
    expect(qualifiesForTop("ARKAD_JAM", [], 100_000)).toBe(true);
  });
});

describe("pistas de Arkad Jam", () => {
  it("usa el mismo sufijo de la clave local y se puede leer de vuelta", () => {
    expect(jamTrack("guitarra", 3)).toBe("guitarra-3");
    expect(parseJamTrack("bateria-11")).toEqual({ instrument: "bateria", index: 11 });
    expect(parseJamTrack("global")).toBeNull();
    expect(parseJamTrack(null)).toBeNull();
  });
});

describe("announceMinigameFinished", () => {
  afterEach(() => vi.restoreAllMocks());

  it("avisa el fin de la partida con un evento de la ventana", () => {
    const oyente = vi.fn();
    window.addEventListener(MINIGAME_FINISHED_EVENT, oyente);
    announceMinigameFinished({ game: "ARKADASH", score: 12 });
    window.removeEventListener(MINIGAME_FINISHED_EVENT, oyente);
    expect((oyente.mock.calls[0][0] as CustomEvent).detail).toEqual({ game: "ARKADASH", score: 12 });
  });
});
