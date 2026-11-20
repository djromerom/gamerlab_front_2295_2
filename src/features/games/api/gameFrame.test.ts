import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import { fetchGameFile, GameFileError } from "@/features/games/api/gameFrame";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const archivo = { id: 12, name: "Ecos del Aula", teamName: "Los Pixel", gameFileURL: "https://blob/juego.zip?sig=x", entry: "index.html" };

beforeEach(() => apiFetch.mockReset());

async function reasonOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (e) {
    return e instanceof GameFileError ? e.reason : "otro";
  }
  return "sin error";
}

describe("fetchGameFile", () => {
  it("un juego en vivo se pide a /videogames/:id", async () => {
    apiFetch.mockResolvedValue(json(archivo));
    await expect(fetchGameFile("live", 12)).resolves.toEqual({
      name: "Ecos del Aula",
      teamName: "Los Pixel",
      gameFileURL: "https://blob/juego.zip?sig=x",
      entry: "index.html",
    });
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/videogames/12");
  });

  it("un histórico se pide al endpoint de HU-40", async () => {
    apiFetch.mockResolvedValue(json(archivo));
    await fetchGameFile("historical", 87);
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/historicals/videogames/87/game-file");
  });

  it("sin zip (gameFileURL vacío) es «noFile»", async () => {
    apiFetch.mockResolvedValue(json({ ...archivo, gameFileURL: "", entry: "" }));
    expect(await reasonOf(fetchGameFile("historical", 87))).toBe("noFile");
  });

  it("404 y 400 son «notFound»", async () => {
    apiFetch.mockResolvedValue(json({ message: "No existe el videojuego histórico 87" }, 404));
    expect(await reasonOf(fetchGameFile("historical", 87))).toBe("notFound");
    apiFetch.mockResolvedValue(json({ message: "El identificador debe ser un número entero" }, 400));
    expect(await reasonOf(fetchGameFile("historical", 87))).toBe("notFound");
  });

  it("un 500 es «failed»", async () => {
    apiFetch.mockResolvedValue(json({}, 500));
    expect(await reasonOf(fetchGameFile("live", 1))).toBe("failed");
  });

  it("un corte de red es «failed»", async () => {
    let message = "";
    apiFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    try {
      await fetchGameFile("live", 1);
    } catch (e) {
      message = e instanceof GameFileError ? `${e.reason}: ${e.message}` : "otro";
    }
    expect(message).toMatch(/^failed: No se pudo conectar/);
  });

  it("en desarrollo cambia el host «azurite» por el del back", async () => {
    apiFetch.mockResolvedValue(json({ ...archivo, gameFileURL: "http://azurite:10000/devstoreaccount1/juego.zip?sig=x" }));
    const file = await fetchGameFile("live", 12);
    expect(new URL(file.gameFileURL).hostname).toBe("api.test");
  });
});
