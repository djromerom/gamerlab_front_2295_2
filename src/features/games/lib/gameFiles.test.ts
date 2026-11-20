import { describe, expect, it } from "vitest";
import { entryUrl, gameKey, mimeType, needsGunzip, parseGameFileRequest, playPath } from "@/features/games/lib/gameFiles";

describe("claves y rutas", () => {
  it("los en vivo conservan el id solo y los históricos llevan prefijo", () => {
    expect(gameKey("live", 12)).toBe("12");
    expect(gameKey("historical", 12)).toBe("historical-12");
  });

  it("la página del juego distingue en vivo e histórico", () => {
    expect(playPath("live", 431)).toBe("/play-game/431");
    expect(playPath("historical", 87)).toBe("/play-game/historical/87");
  });

  it("el archivo de entrada se codifica por tramos", () => {
    expect(entryUrl("historical-3", "Build/index.html")).toBe("/play-game/historical-3/Build/index.html");
    expect(entryUrl("5", "Mi Juego/índice.html")).toBe("/play-game/5/Mi%20Juego/%C3%ADndice.html");
  });
});

describe("parseGameFileRequest", () => {
  it("reconoce los archivos de un juego en vivo y de uno histórico", () => {
    expect(parseGameFileRequest("/play-game/12/Build/game.wasm.gz")).toEqual({ key: "12", filePath: "Build/game.wasm.gz" });
    expect(parseGameFileRequest("/play-game/historical-87/index.html")).toEqual({ key: "historical-87", filePath: "index.html" });
  });

  it("F2: decodifica espacios y tildes", () => {
    expect(parseGameFileRequest("/play-game/5/M%C3%BAsica%20Fondo.ogg")?.filePath).toBe("Música Fondo.ogg");
  });

  it("una secuencia % inválida se busca tal cual", () => {
    expect(parseGameFileRequest("/play-game/5/100%.png")?.filePath).toBe("100%.png");
  });

  it("las páginas de la app no son archivos de juego", () => {
    expect(parseGameFileRequest("/play-game/12")).toBeNull();
    expect(parseGameFileRequest("/play-game/historical/87")).toBeNull();
    expect(parseGameFileRequest("/play-game/abc/index.html")).toBeNull();
    expect(parseGameFileRequest("/equipos")).toBeNull();
  });
});

describe("mimeType (F3)", () => {
  it.each([
    ["index.html", "text/html"],
    ["main.mjs", "text/javascript"],
    ["sprites/hero.svg", "image/svg+xml"],
    ["sfx/jump.ogg", "audio/ogg"],
    ["sfx/coin.mp3", "audio/mpeg"],
    ["sfx/hit.wav", "audio/wav"],
    ["fonts/pixel.woff2", "font/woff2"],
    ["fonts/pixel.ttf", "font/ttf"],
    ["img/fondo.WEBP", "image/webp"],
    ["juego.apk", "application/octet-stream"],
  ])("%s → %s", (path, type) => {
    expect(mimeType(path)).toBe(type);
  });

  it("Unity: el tipo es el del archivo de adentro", () => {
    expect(mimeType("Build/game.wasm.gz")).toBe("application/wasm");
    expect(mimeType("Build/game.framework.js.br")).toBe("text/javascript");
    expect(mimeType("Build/game.data.unityweb")).toBe("application/octet-stream");
  });

  it("un nombre con punto en el medio usa la última extensión (antes data.json salía como binario)", () => {
    expect(mimeType("data.json")).toBe("application/json");
    expect(mimeType("niveles/nivel.1.png")).toBe("image/png");
  });

  it("sin extensión o desconocida es binario", () => {
    expect(mimeType("LICENSE")).toBe("application/octet-stream");
    expect(mimeType("archivo.xyz")).toBe("application/octet-stream");
  });
});

describe("needsGunzip", () => {
  it("solo los .gz de la carpeta Build de Unity", () => {
    expect(needsGunzip("Build/game.wasm.gz")).toBe(true);
    expect(needsGunzip("assets/datos.gz")).toBe(false);
    expect(needsGunzip("Build/game.wasm.br")).toBe(false);
  });
});
