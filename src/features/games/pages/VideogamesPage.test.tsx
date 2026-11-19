import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const customFetch = vi.fn();
vi.mock("@/hooks/useFetch", () => ({ useFetch: () => customFetch }));
vi.mock("@/features/games/hooks/useLikesSocket", () => ({ useLikesSocket: () => ({}) }));
vi.mock("@/components/NavBar", () => ({ default: () => <nav>Menú</nav> }));
vi.mock("@/components/background/ArkadBackground", () => ({ ArkadBackground: () => null }));
vi.mock("@/components/TextSizeControl", () => ({ TextSizeControl: () => null }));
vi.mock("@/components/DiscordButton", () => ({ DiscordButton: () => null }));

import VideogamesPage from "./VideogamesPage";

const renderPage = (url = "/equipos") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <VideogamesPage />
    </MemoryRouter>,
  );

const team = {
  id: 1,
  teamName: "Byte Club",
  teamCode: "N1-ABC-1001",
  members: [],
  videogame: { id: 10, name: "Ruta 66", videogameStatusId: 1, _count: { likedBy: 0 } },
};

afterEach(() => {
  cleanup();
  customFetch.mockReset();
});

describe("VideogamesPage · /equipos sin resultados (BG-66)", () => {
  it("sin equipos inscritos lo dice en vez de quedar en blanco", async () => {
    customFetch.mockResolvedValue(new Response("[]", { status: 200 }));
    renderPage();
    expect(await screen.findByText("Todavía no hay videojuegos inscritos en esta edición.")).toBeTruthy();
  });

  it("si la búsqueda no deja ninguno, habla de la búsqueda", async () => {
    customFetch.mockResolvedValue(new Response(JSON.stringify([team]), { status: 200 }));
    renderPage("/equipos?search=zzz");
    expect(await screen.findByText(/coincidan con la búsqueda/)).toBeTruthy();
  });
});
