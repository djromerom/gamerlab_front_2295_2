import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProfessorRankingTiesPage from "@/features/results/pages/ProfessorRankingTiesPage";
import type { TieGroup } from "@/features/results/api/ranking";

const fetchMyTies = vi.fn();

vi.mock("@/features/results/api/ranking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/results/api/ranking")>()),
  fetchMyTies: (...args: unknown[]) => fetchMyTies(...args),
}));

vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const tie = (extra: Partial<TieGroup>): TieGroup => ({
  tieKey: "3:N1:4.20:1,2",
  editionId: 3,
  level: 1,
  score: 4.2,
  positions: [1, 2],
  affectsPodium: true,
  rule: "PROFESSOR",
  status: "PENDING",
  deciders: [],
  teams: [
    { teamId: 1, teamCode: "N1-AYP-001", teamName: "Indie Caribe", videogameName: null, registrationDate: "2026-10-01", professors: [] },
    { teamId: 2, teamCode: "N1-AYP-002", teamName: "Studio Norte", videogameName: null, registrationDate: "2026-10-02", professors: [] },
  ],
  order: [1, 2],
  decision: null,
  explanation: "Lo decide el profesor común.",
  ...extra,
});

describe("Empates del profesor, solo por nivel (ARK-273)", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("cada empate se llama por su nivel, también el de colegios", async () => {
    fetchMyTies.mockResolvedValue([
      tie({ tieKey: "3:N0:3.60:7,8", level: 0, score: 3.6 }),
      tie({ tieKey: "3:N1:3.90:5,6", score: 3.9 }),
    ]);
    const { container } = render(
      <MemoryRouter>
        <ProfessorRankingTiesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("N0 · 3.60")).toBeTruthy();
    expect(screen.getByText("N1 · 3.90")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Externos/);
  });
});
