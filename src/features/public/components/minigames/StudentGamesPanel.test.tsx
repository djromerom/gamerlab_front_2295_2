import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentHighlightedGame } from "@/features/public/api/highlightedGames";
import StudentGamesPanel from "./StudentGamesPanel";

const fetchHighlightedGames = vi.fn();
vi.mock("@/features/public/api/highlightedGames", () => ({
  fetchHighlightedGames: (...args: unknown[]) => fetchHighlightedGames(...args),
}));

const ED_2026 = { id: 4, year: 2026, semester: 10, title: "Feria Gamer 2026 - S1" };
const ED_2025 = { id: 3, year: 2025, semester: 30, title: "Feria Gamer 2025 - S2" };
const JUEGOS: StudentHighlightedGame[] = [
  { id: 12, name: "Ecos del Aula", teamName: "Los Pixeles", edition: ED_2026, logoUrl: null, hasGameFile: true, play: { type: "live", id: 431 } },
  { id: 13, name: "Sin Zip", teamName: "Equipo B", edition: ED_2026, logoUrl: null, hasGameFile: false, play: { type: "live", id: 432 } },
  { id: 15, name: "Otro juego", teamName: "Equipo histórico", edition: ED_2025, logoUrl: null, hasGameFile: true, play: { type: "historical", id: 87 } },
];

function simularPantalla(tactil: boolean) {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: tactil,
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  fetchHighlightedGames.mockReset();
  simularPantalla(false);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("StudentGamesPanel", () => {
  it("no pide los destacados hasta que la pestaña se abre", async () => {
    fetchHighlightedGames.mockResolvedValue(JUEGOS);
    const { rerender } = render(<StudentGamesPanel active={false} />);
    expect(fetchHighlightedGames).not.toHaveBeenCalled();
    rerender(<StudentGamesPanel active />);
    await screen.findByText("Ecos del Aula");
    expect(fetchHighlightedGames).toHaveBeenCalledTimes(1);
  });

  it("muestra cada juego con su equipo y su edición, y filtra por edición", async () => {
    fetchHighlightedGames.mockResolvedValue(JUEGOS);
    render(<StudentGamesPanel active />);
    await screen.findByText("Ecos del Aula");
    expect(screen.getByText("Los Pixeles")).toBeTruthy();
    expect(screen.getAllByText("Feria 2026 · 1er semestre").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Feria 2025 · 2º semestre" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Otro juego")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Feria 2025 · 2º semestre" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("solo se puede jugar el que tiene zip; los históricos esperan HU-40", async () => {
    fetchHighlightedGames.mockResolvedValue(JUEGOS);
    render(<StudentGamesPanel active />);
    await screen.findByText("Ecos del Aula");
    expect(screen.getAllByRole("button", { name: /^Jugar/ })).toHaveLength(1);
    expect(screen.getByText("Sin versión para jugar en la web")).toBeTruthy();
    expect(screen.getByText("Pronto se podrá jugar aquí")).toBeTruthy();
  });

  it("en el computador abre el juego en la cabina y vuelve a la lista", async () => {
    fetchHighlightedGames.mockResolvedValue(JUEGOS);
    render(<StudentGamesPanel active />);
    fireEvent.click(await screen.findByRole("button", { name: "Jugar Ecos del Aula" }));
    const iframe = screen.getByTitle("Ecos del Aula, de Los Pixeles");
    expect(iframe.getAttribute("src")).toBe("/play-game/431?embed=1");
    expect(iframe.getAttribute("allow")).toBe("fullscreen; autoplay; gamepad");

    fireEvent.click(screen.getByRole("button", { name: /Juegos de los estudiantes/ }));
    expect(screen.queryByTitle("Ecos del Aula, de Los Pixeles")).toBeNull();
    expect(screen.getByText("Ecos del Aula")).toBeTruthy();
  });

  it("al salir de la pestaña se cierra el juego abierto", async () => {
    fetchHighlightedGames.mockResolvedValue(JUEGOS);
    const { rerender } = render(<StudentGamesPanel active />);
    fireEvent.click(await screen.findByRole("button", { name: "Jugar Ecos del Aula" }));
    rerender(<StudentGamesPanel active={false} />);
    expect(screen.queryByTitle("Ecos del Aula, de Los Pixeles")).toBeNull();
  });

  it("en el celular avisa que se juega en computador y no carga el juego", async () => {
    simularPantalla(true);
    fetchHighlightedGames.mockResolvedValue(JUEGOS);
    render(<StudentGamesPanel active />);
    await screen.findByText("Ecos del Aula");
    expect(screen.getByText("Este juego se juega en computador")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Jugar/ })).toBeNull();
  });

  it("sin destacados lo dice, y con una sola edición no muestra el filtro", async () => {
    fetchHighlightedGames.mockResolvedValue([]);
    render(<StudentGamesPanel active />);
    await screen.findByText(/Pronto verás aquí/);
    expect(screen.queryByRole("group", { name: "Filtrar por edición" })).toBeNull();
  });

  it("si falla la carga permite reintentar", async () => {
    fetchHighlightedGames.mockRejectedValueOnce(new Error("sin red")).mockResolvedValue(JUEGOS);
    render(<StudentGamesPanel active />);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.getByText("Ecos del Aula")).toBeTruthy());
    expect(fetchHighlightedGames).toHaveBeenCalledTimes(2);
  });
});
