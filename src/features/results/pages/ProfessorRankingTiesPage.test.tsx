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
  external: false,
  score: 4.2,
  positions: [1, 2],
  affectsPodium: true,
  rule: "PROFESSOR",
  status: "PENDING",
  deciders: [],
  teams: [
    { teamId: 1, teamCode: "N1-EXT-001", teamName: "Indie Caribe", videogameName: null, registrationDate: "2026-10-01", professors: [] },
    { teamId: 2, teamCode: "N2-EXT-002", teamName: "Studio Norte", videogameName: null, registrationDate: "2026-10-02", professors: [] },
  ],
  order: [1, 2],
  decision: null,
  explanation: "Lo decide el profesor común.",
  ...extra,
});

describe("Empates del profesor con el grupo Externos (HU-38, ARK-220)", () => {
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

  it("un empate entre externos se llama «Externos» y uno de nivel «N1»", async () => {
    fetchMyTies.mockResolvedValue([
      tie({ tieKey: "3:EXT:4.20:1,2", level: null, external: true }),
      tie({ tieKey: "3:N1:3.90:5,6", score: 3.9 }),
    ]);
    const { container } = render(
      <MemoryRouter>
        <ProfessorRankingTiesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Externos · 4.20")).toBeTruthy();
    expect(screen.getByText("N1 · 3.90")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Nnull/);
  });
});
