import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import {
  addHistoricalHighlightedGame,
  fetchHistoricalVideogames,
  removeHistoricalHighlightedGame,
} from "@/features/editions/api/highlightedGames";

const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });

beforeEach(() => apiFetch.mockReset());

describe("fetchHistoricalVideogames", () => {
  it("pide los históricos de la edición", async () => {
    apiFetch.mockResolvedValue(respuesta([{ id: 87, name: "Ruta 66", gameFileUrl: "https://zip" }]));
    await expect(fetchHistoricalVideogames(3)).resolves.toEqual([{ id: 87, name: "Ruta 66", gameFileUrl: "https://zip" }]);
    expect(apiFetch).toHaveBeenCalledWith("http://api.test/historicals/historical-videogames/3");
  });

  it("un 404 (sin volcado o sin juegos) es una lista vacía", async () => {
    apiFetch.mockResolvedValue(respuesta({ message: "No historical teams" }, 404));
    await expect(fetchHistoricalVideogames(3)).resolves.toEqual([]);
  });

  it("otro error se avisa con el mensaje del back", async () => {
    apiFetch.mockResolvedValue(respuesta({ message: "Falla" }, 500));
    await expect(fetchHistoricalVideogames(3)).rejects.toThrow("Falla");
  });
});

describe("addHistoricalHighlightedGame", () => {
  it("envía solo historicalVideogameId", async () => {
    apiFetch.mockResolvedValue(respuesta({ id: 1, editionId: 3, videogameId: null, historicalVideogameId: 87 }, 201));
    await addHistoricalHighlightedGame(3, 87);
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/editions/3/highlighted-games");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ historicalVideogameId: 87 });
  });

  it("un 409 llega con el mensaje del back", async () => {
    apiFetch.mockResolvedValue(respuesta({ message: "Este juego ya está destacado en esta edición." }, 409));
    await expect(addHistoricalHighlightedGame(3, 87)).rejects.toThrow("ya está destacado");
  });
});

describe("removeHistoricalHighlightedGame", () => {
  it("usa la ruta /historical/:id", async () => {
    apiFetch.mockResolvedValue(new Response(null, { status: 200 }));
    await removeHistoricalHighlightedGame(3, 87);
    expect(apiFetch).toHaveBeenCalledWith("http://api.test/editions/3/highlighted-games/historical/87", {
      method: "DELETE",
    });
  });

  it("un 404 se avisa", async () => {
    apiFetch.mockResolvedValue(respuesta({ message: "No hay un juego histórico #87 destacado" }, 404));
    await expect(removeHistoricalHighlightedGame(3, 87)).rejects.toThrow("No hay un juego histórico");
  });
});
