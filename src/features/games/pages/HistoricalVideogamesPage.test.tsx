import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchHistoricalTeamsWithScores: vi.fn(),
  fetchEditionById: vi.fn(),
}));
vi.mock("@/api/editions", () => mocks);
vi.mock("@/components/NavBar", () => ({ default: () => <nav>Menú</nav> }));
vi.mock("@/components/background/ArkadBackground", () => ({ ArkadBackground: () => null }));
vi.mock("@/components/TextSizeControl", () => ({ TextSizeControl: () => null }));
vi.mock("@/components/DiscordButton", () => ({ DiscordButton: () => null }));

import HistoricalVideogamesPage from "./HistoricalVideogamesPage";

const edition2025S1 = { id: 2, year: 2025, semester: 10, title: "Feria 2025-1", status: "ARCHIVED" };

const historicalTeam = (id: number, teamCode: string, teamName: string, gameName: string, finalScore: number | null = null) => ({
  id,
  teamCode,
  teamName,
  isExternal: false,
  members: [],
  videogame: { id: id * 10, name: gameName, finalScore },
});

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/ediciones-pasadas/:editionId/juegos" element={<HistoricalVideogamesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.fetchHistoricalTeamsWithScores.mockReset().mockResolvedValue([]);
  mocks.fetchEditionById.mockReset().mockResolvedValue(edition2025S1);
});
afterEach(cleanup);

describe("HistoricalVideogamesPage (BG-66)", () => {
  it("un id que no es número no llama a la API y dice que no existe la edición", async () => {
    renderAt("/ediciones-pasadas/abc/juegos");
    expect(await screen.findByText("No encontramos esta edición.")).toBeTruthy();
    expect(mocks.fetchHistoricalTeamsWithScores).not.toHaveBeenCalled();
    expect(mocks.fetchEditionById).not.toHaveBeenCalled();
  });

  it("una edición que el back no encuentra también lo dice", async () => {
    mocks.fetchEditionById.mockRejectedValue(new Error("Edition with ID 99 not found"));
    renderAt("/ediciones-pasadas/99/juegos");
    expect(await screen.findByText("No encontramos esta edición.")).toBeTruthy();
    expect(mocks.fetchEditionById).toHaveBeenCalledWith(99);
  });

  it("una edición sin proyectos lo dice sin hablar de búsqueda y titula con el semestre", async () => {
    renderAt("/ediciones-pasadas/2/juegos");
    expect(await screen.findByText("Esta edición no tiene proyectos registrados.")).toBeTruthy();
    expect(screen.queryByText(/coincidan con la búsqueda/)).toBeNull();
    expect(screen.getByText("2025 - 1")).toBeTruthy();
  });

  it("quita el código del equipo delante del nombre del juego y del equipo", async () => {
    mocks.fetchHistoricalTeamsWithScores.mockResolvedValue([
      historicalTeam(1, "N1-ABC-1001", "N1-ABC-1001 - Byte Club", "N1-ABC-1001 - Ruta 66"),
    ]);
    renderAt("/ediciones-pasadas/2/juegos");
    expect(await screen.findByText("Ruta 66")).toBeTruthy();
    expect(screen.queryByText(/N1-ABC-1001 - Ruta 66/)).toBeNull();
  });

  it("en el podio un nombre largo se parte en su columna en vez de sacar los puestos de la pantalla", async () => {
    mocks.fetchHistoricalTeamsWithScores.mockResolvedValue([
      historicalTeam(1, "N1-ABC-1001", "Byte Club", "Supercalifragilístico Aventura", 4.9),
      historicalTeam(2, "N1-ABC-1002", "Pixel", "Ruta 66", 4.7),
      historicalTeam(3, "N1-ABC-1003", "Orbita", "Orbita", 4.5),
    ]);
    renderAt("/ediciones-pasadas/2/juegos");
    const name = await screen.findByText("Supercalifragilístico Aventura");
    expect(name.className.split(" ")).toContain("wrap-anywhere");
    expect(name.closest(".cursor-pointer")!.className.split(" ")).toContain("min-w-0");
  });

  it("si se busca y no hay resultados, ahí sí habla de la búsqueda", async () => {
    mocks.fetchHistoricalTeamsWithScores.mockResolvedValue([historicalTeam(1, "N1-ABC-1001", "Byte Club", "Ruta 66")]);
    renderAt("/ediciones-pasadas/2/juegos");
    await screen.findByText("Ruta 66");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "zzz" } });
    expect(screen.getByText(/coincidan con la búsqueda/)).toBeTruthy();
  });
});
