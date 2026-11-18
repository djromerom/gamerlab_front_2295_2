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

// Lo que devuelve el back: equipos con la casilla «Externo» en N1 y en N0; compiten en su nivel (ARK-272)
const ALL = [
  row(1, "N1-ABC-101", "Pixel Hunters", 4.5, 1),
  row(2, "N1-ABC-102", "Code Knights", 4.1, 2),
  row(40, "N1-DAT-435", "Operación de Datos", 3.0, 3, true),
  row(50, "N0-COL-001", "Aventura Escolar", 4.0, 1),
  row(51, "N0-COL-007", "Red Invisible", 3.6, 2, true),
];

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

describe("Ranking público por nivel, sin pestaña «Externos» (ARK-273)", () => {
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
    await screen.findByRole("button", { name: "Colegios" });
  };

  it("no hay pestaña «Externos»", async () => {
    await renderPage();
    expect(screen.queryByRole("button", { name: "Externos" })).toBeNull();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Todos",
      "Primer Semestre",
      "Segundo Semestre",
      "Tercer Semestre",
      "Cuarto Semestre",
      "Décimo Semestre",
      "Colegios",
    ]);
  });

  it("un equipo marcado «Externo» sale en su semestre", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Primer Semestre" }));

    expect(await screen.findByText("Operación de Datos")).toBeTruthy();
    expect(screen.getByText("Pixel Hunters")).toBeTruthy();
    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith(expect.stringMatching(/by-n\/n1$/)));
  });

  it("un colegio marcado «Externo» compite en Colegios como los demás", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Colegios" }));

    expect(await screen.findByText("Red Invisible")).toBeTruthy();
    expect(screen.getByText("Aventura Escolar")).toBeTruthy();
  });
});
