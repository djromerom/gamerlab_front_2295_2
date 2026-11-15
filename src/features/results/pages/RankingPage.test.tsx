import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RankingPage from "@/features/results/pages/RankingPage";

const apiFetch = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));
vi.mock("@/components/NavBar", () => ({ default: () => <nav>Navegación</nav> }));
vi.mock("@/components/background/ArkadBackground", () => ({ ArkadBackground: () => null }));
vi.mock("@/components/TextSizeControl", () => ({ TextSizeControl: () => null }));
vi.mock("@/components/DiscordButton", () => ({ DiscordButton: () => null }));

const row = (teamId: number, teamCode: string, videogameName: string, finalScore: number, levelPosition: number, isExternal = false) => ({
  teamId,
  teamCode,
  videogameName,
  finalScore,
  levelPosition,
  isExternal,
});

// Lo que devuelve el back: un externo de N1 y otro de N2, con su puesto dentro de Externos
const ALL = [
  row(40, "N1-EXT-001", "Indie Caribe", 4.8, 1, true),
  row(1, "N1-ABC-101", "Pixel Hunters", 4.5, 1),
  row(41, "N2-EXT-002", "Studio Norte", 4.6, 2, true),
  row(2, "N1-ABC-102", "Code Knights", 4.1, 2),
  row(3, "N1-ABC-103", "Byte Me", 3.9, 3),
  row(50, "N0-COL-001", "Aventura Escolar", 4.0, 1, true),
];

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

describe("Ranking público con el grupo Externos (HU-38, ARK-220)", () => {
  beforeEach(() => {
    apiFetch.mockImplementation((url: string) => {
      if (url.endsWith("/settings/show-ranking")) return Promise.resolve(json({ showRanking: true }));
      const n = url.split("/").pop();
      if (n === "all") return Promise.resolve(json(ALL));
      return Promise.resolve(json(ALL.filter((t) => t.teamCode.toLowerCase().startsWith(`${n}-`))));
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  const renderPage = async () => {
    render(
      <MemoryRouter>
        <RankingPage />
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "Externos" });
  };

  it("en un nivel no aparece el externo de ese nivel", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Primer Semestre" }));

    expect(await screen.findByText("Pixel Hunters")).toBeTruthy();
    expect(screen.getByText("Code Knights")).toBeTruthy();
    expect(screen.queryByText("Indie Caribe")).toBeNull();
  });

  it("la pestaña Externos muestra el podio de los externos de cualquier nivel", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Externos" }));

    expect(await screen.findByText("Indie Caribe")).toBeTruthy();
    expect(screen.getByText("Studio Norte")).toBeTruthy();
    expect(screen.queryByText("Pixel Hunters")).toBeNull();
    // Un colegio externo sigue en Colegios
    expect(screen.queryByText("Aventura Escolar")).toBeNull();
    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith(expect.stringMatching(/by-n\/all$/)));
  });

  it("un colegio externo sigue en Colegios", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Colegios" }));

    expect(await screen.findByText("Aventura Escolar")).toBeTruthy();
  });
});
