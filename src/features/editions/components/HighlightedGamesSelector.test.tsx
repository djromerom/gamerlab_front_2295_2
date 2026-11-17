import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HighlightedGamesSelector } from "./HighlightedGamesSelector";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const API = import.meta.env.VITE_ENDPOINT_BACKEND;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const destacadoVivo = {
  id: 1,
  name: "Ecos del Aula",
  teamName: "Los Pixeles",
  edition: { id: 3, year: 2025, semester: 30, title: "" },
  logoUrl: null,
  hasGameFile: true,
  play: { type: "live", id: 431 },
};

type Call = { url: string; method: string; body?: string };

function stubBackend(routes: Record<string, () => Response>) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: init?.body as string | undefined });
      const handler = routes[`${method} ${url.replace(API, "")}`];
      return handler ? handler() : json({ message: "no mock" }, 500);
    }),
  );
  return calls;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HighlightedGamesSelector", () => {
  it("en una edición archivada lista los históricos, marca los que tienen zip y no repite el destacado en vivo", async () => {
    stubBackend({
      "GET /highlighted-games?editionId=3": () => json([destacadoVivo]),
      "GET /historicals/historical-videogames/3": () =>
        json([
          { id: 87, name: "Ruta 66", gameFileUrl: "https://zip/87" },
          { id: 88, name: "Sin Archivo", gameFileUrl: null },
          { id: 89, name: "Ecos del Aula", gameFileUrl: "https://zip/89" },
        ]),
    });
    render(<HighlightedGamesSelector editionId={3} editionStatus="ARCHIVED" />);

    expect(await screen.findByText("Juegos históricos (2 disponibles)")).toBeTruthy();
    expect(screen.getByText(/2 de 3 tienen zip/)).toBeTruthy();
    const ruta = screen.getByText("Ruta 66").closest("div.flex.items-center.justify-between") as HTMLElement;
    expect(within(ruta).getByText("Con zip")).toBeTruthy();
    const sinArchivo = screen.getByText("Sin Archivo").closest("div.flex.items-center.justify-between") as HTMLElement;
    expect(within(sinArchivo).getByText("Sin zip")).toBeTruthy();
    // La versión histórica de «Ecos del Aula» no se ofrece: ya está destacada en vivo
    expect(screen.queryByRole("button", { name: "Destacar Ecos del Aula" })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(screen.queryByText("Sin Archivo")).toBeNull());
  });

  it("destaca un histórico con historicalVideogameId y lo quita por la ruta de históricos", async () => {
    const calls = stubBackend({
      "GET /highlighted-games?editionId=3": () => json([]),
      "GET /historicals/historical-videogames/3": () => json([{ id: 87, name: "Ruta 66", gameFileUrl: "https://zip" }]),
      "POST /editions/3/highlighted-games": () =>
        json({ id: 9, editionId: 3, videogameId: null, historicalVideogameId: 87 }, 201),
      "DELETE /editions/3/highlighted-games/historical/87": () => new Response(null, { status: 200 }),
    });
    render(<HighlightedGamesSelector editionId={3} editionStatus="ARCHIVED" />);

    fireEvent.click(await screen.findByRole("button", { name: "Destacar Ruta 66" }));
    await screen.findByText("Destacados (1)");
    const post = calls.find((c) => c.method === "POST");
    expect(JSON.parse(post!.body!)).toEqual({ historicalVideogameId: 87 });

    fireEvent.click(screen.getByRole("button", { name: "Quitar Ruta 66 de destacados" }));
    await screen.findByText("Destacados (0)");
    expect(calls.some((c) => c.method === "DELETE" && c.url.endsWith("/highlighted-games/historical/87"))).toBe(true);
  });

  it("en una edición archivada, un destacado en vivo de antes se quita con el DELETE de siempre", async () => {
    const calls = stubBackend({
      "GET /highlighted-games?editionId=3": () => json([destacadoVivo]),
      "GET /historicals/historical-videogames/3": () => json({ message: "No historical teams" }, 404),
      "DELETE /editions/3/highlighted-games/431": () => new Response(null, { status: 200 }),
    });
    render(<HighlightedGamesSelector editionId={3} editionStatus="ARCHIVED" />);

    expect(await screen.findByText("Esta edición no tiene juegos históricos.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quitar Ecos del Aula de destacados" }));
    await waitFor(() => expect(calls.some((c) => c.method === "DELETE" && c.url.endsWith("/highlighted-games/431"))).toBe(true));
  });

  it("en una edición no archivada lista los juegos en vivo y destaca con videogameId", async () => {
    const calls = stubBackend({
      "GET /highlighted-games?editionId=5": () => json([]),
      "GET /editions/5/videogames": () => json([{ id: 12, name: "Nave", teamName: "Equipo X" }]),
      "POST /editions/5/highlighted-games": () =>
        json({ id: 2, editionId: 5, videogameId: 12, historicalVideogameId: null }, 201),
    });
    render(<HighlightedGamesSelector editionId={5} editionStatus="ACTIVE" />);

    expect(await screen.findByText("Catálogo de juegos (1 disponibles)")).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText("Con zip")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Destacar Nave" }));
    await screen.findByText("Destacados (1)");
    expect(JSON.parse(calls.find((c) => c.method === "POST")!.body!)).toEqual({ videogameId: 12 });
    expect(calls.some((c) => c.url.includes("historical-videogames"))).toBe(false);
  });
});
