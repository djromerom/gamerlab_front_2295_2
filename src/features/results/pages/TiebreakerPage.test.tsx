import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TiebreakerPage from "@/features/results/pages/TiebreakerPage";
import type { RankedTeam, RankingDecision, RankingGroup, RankingSnapshot, TieGroup } from "@/features/results/api/ranking";

const fetchRanking = vi.fn();
const fetchRankingTies = vi.fn();
const fetchRankingDecisions = vi.fn();
const finalizeRanking = vi.fn();

vi.mock("@/features/results/api/ranking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/results/api/ranking")>()),
  fetchRanking: (...args: unknown[]) => fetchRanking(...args),
  fetchRankingTies: (...args: unknown[]) => fetchRankingTies(...args),
  fetchRankingDecisions: (...args: unknown[]) => fetchRankingDecisions(...args),
  finalizeRanking: (...args: unknown[]) => finalizeRanking(...args),
}));

vi.mock("@/layouts/AppSidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

const team = (teamId: number, teamCode: string, teamName: string, finalScore: number, position: number, isExternal = false): RankedTeam => ({
  position,
  teamId,
  teamCode,
  teamName,
  isExternal,
  videogameId: teamId,
  videogameName: `Juego ${teamName}`,
  logoUrl: null,
  finalScore,
  avgJunior: finalScore,
  avgSenior: null,
  juniorEvaluations: 3,
  juniorCounted: 3,
  juniorNotCounted: 0,
  seniorEvaluations: 0,
  lessThanMinEvaluations: false,
  missingProfessorScore: false,
  registrationDate: "2026-10-01T12:00:00.000Z",
  podium: true,
  tieKey: null,
  provisional: false,
});

const group = (level: number | null, teams: RankedTeam[], external = false): RankingGroup => ({
  level,
  external,
  label: external ? "Externos" : `N${level}`,
  teams,
  podium: teams,
  ties: [],
  withoutScore: [],
});

const N1 = group(1, [team(1, "N1-ABC-101", "Pixel Hunters", 4.5, 1), team(2, "N1-ABC-102", "Code Knights", 4.1, 2)]);
const EXTERNAL = group(null, [team(40, "N1-EXT-001", "Indie Caribe", 4.8, 1, true), team(41, "N2-EXT-002", "Studio Norte", 4.2, 2, true)], true);

const snapshot = (external: RankingGroup | null = EXTERNAL): RankingSnapshot => ({
  editionId: 3,
  podiumSize: 3,
  weighting: { configured: true, juniorPct: 40, seniorPct: 60 },
  pendingTies: 0,
  finalized: null,
  levels: [N1],
  external,
});

const EXTERNAL_TIE: TieGroup = {
  tieKey: "3:EXT:4.20:41,42",
  editionId: 3,
  level: null,
  external: true,
  score: 4.2,
  positions: [2, 3],
  affectsPodium: true,
  rule: "MANUAL",
  status: "PENDING",
  deciders: [],
  teams: [],
  order: [41, 42],
  decision: null,
  explanation: "Empate entre externos sin profesor común: lo resuelve el administrador.",
};

const EXTERNAL_DECISION: RankingDecision = {
  id: 7,
  editionId: 3,
  level: null,
  external: true,
  score: 4.2,
  tieKey: "3:EXT:4.20:41,42",
  teamIds: [41, 42],
  orderedTeamIds: [42, 41],
  method: "ADMIN",
  reason: "Mejor presentación",
  decidedBy: { id: "a1", name: "Admin Romero" },
  decidedAt: "2026-11-15T20:00:00.000Z",
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <TiebreakerPage />
    </MemoryRouter>,
  );

describe("Ranking oficial con el grupo Externos (HU-38, ARK-220)", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    fetchRankingTies.mockResolvedValue([]);
    fetchRankingDecisions.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("muestra el podio de Externos aparte de los niveles, con el nivel de origen de cada equipo", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    renderPage();

    const external = await screen.findByRole("region", { name: "Podio Externos" });
    expect(within(external).getByText("Indie Caribe")).toBeTruthy();
    expect(within(external).getByText(/N2-EXT-002 · nivel 2/)).toBeTruthy();
    expect(within(external).getByText(/no compiten en su nivel/)).toBeTruthy();

    const n1 = screen.getByRole("region", { name: "Podio N1" });
    expect(within(n1).queryByText("Indie Caribe")).toBeNull();
    expect(within(n1).getByText("Pixel Hunters")).toBeTruthy();
  });

  it("sin equipos externos no muestra el grupo", async () => {
    fetchRanking.mockResolvedValue(snapshot(null));
    renderPage();

    await screen.findByRole("region", { name: "Podio N1" });
    expect(screen.queryByRole("region", { name: "Podio Externos" })).toBeNull();
  });

  it("los empates y decisiones de externos dicen «Externos», no «Nnull»", async () => {
    fetchRanking.mockResolvedValue({ ...snapshot(), pendingTies: 1 });
    fetchRankingTies.mockResolvedValue([EXTERNAL_TIE]);
    fetchRankingDecisions.mockResolvedValue([EXTERNAL_DECISION]);
    const { container } = renderPage();

    expect(await screen.findByText("Externos · 4.20")).toBeTruthy();
    expect(screen.getByText("Mejor presentación")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Nnull/);
  });

  it("al elegir un nivel explica que el grupo Externos no se muestra", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    renderPage();
    await screen.findByRole("region", { name: "Podio Externos" });

    fetchRanking.mockResolvedValue(snapshot(null));
    fireEvent.change(screen.getByDisplayValue("Todos los niveles"), { target: { value: "1" } });

    expect(await screen.findByText(/no se muestra el grupo Externos/)).toBeTruthy();
    await waitFor(() => expect(fetchRanking).toHaveBeenLastCalledWith({ level: 1, top: 3 }));
  });

  it("el cierre cuenta los niveles aparte del grupo Externos", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    finalizeRanking.mockResolvedValue({
      editionId: 3,
      teams: 4,
      levels: [
        { level: 1, external: false, label: "N1", teams: 2 },
        { level: null, external: true, label: "Externos", teams: 2 },
      ],
    });
    vi.stubGlobal("confirm", () => true);
    renderPage();
    await screen.findByRole("region", { name: "Podio Externos" });

    fireEvent.click(screen.getByRole("button", { name: "Definir ranking final" }));
    expect(await screen.findByText("Ranking final definido: 4 grupos en 1 nivel y el grupo Externos.")).toBeTruthy();
  });
});
