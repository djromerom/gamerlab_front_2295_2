import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import { fetchHighlightedGames } from "@/features/public/api/highlightedGames";

const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });

beforeEach(() => apiFetch.mockReset());

describe("fetchHighlightedGames", () => {
  it("sin edición pide los destacados de todas las ediciones", async () => {
    apiFetch.mockResolvedValue(respuesta([{ id: 1 }]));
    await expect(fetchHighlightedGames()).resolves.toEqual([{ id: 1 }]);
    expect(apiFetch).toHaveBeenCalledWith("http://api.test/highlighted-games");
  });

  it("con edición filtra por editionId", async () => {
    apiFetch.mockResolvedValue(respuesta([]));
    await fetchHighlightedGames(4);
    expect(apiFetch).toHaveBeenCalledWith("http://api.test/highlighted-games?editionId=4");
  });

  it("una respuesta que no es un arreglo se toma como vacía", async () => {
    apiFetch.mockResolvedValue(respuesta({ data: [] }));
    await expect(fetchHighlightedGames()).resolves.toEqual([]);
  });

  it("si el servidor falla, avisa con un error", async () => {
    apiFetch.mockResolvedValue(respuesta({ message: "x" }, 500));
    await expect(fetchHighlightedGames()).rejects.toThrow("error 500");
  });
});
