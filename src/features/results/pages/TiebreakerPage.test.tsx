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
});

const group = (level: number, teams: RankedTeam[]): RankingGroup => ({
  level,
  label: `N${level}`,
  teams,
  podium: teams,
  ties: [],
  withoutScore: [],
});

// ARK-273: un equipo con la casilla «Externo» compite en su nivel; un colegio marcado, en Colegios (N0)
const N0 = group(0, [team(10, "N0-COL-001", "Aventura Escolar", 3.9, 1), team(11, "N0-COL-007", "Red Invisible", 3.6, 2, true)]);
const N1 = group(1, [team(1, "N1-ABC-101", "Pixel Hunters", 4.5, 1), team(40, "N1-DAT-435", "Operación de Datos", 3.0, 2, true)]);

const snapshot = (): RankingSnapshot => ({
  editionId: 3,
  podiumSize: 3,
  weighting: { configured: true, juniorPct: 40, seniorPct: 60 },
  finalized: null,
  levels: [N0, N1],
});

const N0_TIE: TieGroup = {
  tieKey: "3:N0:3.60:11,12",
  editionId: 3,
  level: 0,
  score: 3.6,
  positions: [2, 3],
  affectsPodium: true,
  rule: "REGISTRATION",
  status: "RESOLVED",
  teams: [
    { teamId: 11, teamCode: "N0-COL-007", teamName: "Red Invisible", videogameName: "Juego", registrationDate: "2026-10-05T15:00:00.000Z" },
    { teamId: 12, teamCode: "N0-COL-009", teamName: "Faro", videogameName: "Juego", registrationDate: "2026-10-03T15:00:00.000Z" },
  ],
  order: [12, 11],
  explanation:
    "Resuelto por fecha de inscripción: primero el grupo inscrito antes. Orden: N0-COL-009 (2026-10-03T15:00:00.000Z), N0-COL-007 (2026-10-05T15:00:00.000Z).",
};

const N0_DECISION: RankingDecision = {
  id: 7,
  editionId: 3,
  level: 0,
  score: 3.6,
  tieKey: "3:N0:3.60:11,12",
  teamIds: [11, 12],
  orderedTeamIds: [11, 12],
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

describe("Ranking oficial solo por nivel, sin grupo «Externos» (ARK-273)", () => {
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

  it("cada equipo marcado «Externo» sale en su nivel y no hay grupo «Externos»", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    const { container } = renderPage();

    const n1 = await screen.findByRole("region", { name: "Podio N1" });
    expect(within(n1).getByText("Operación de Datos")).toBeTruthy();
    const n0 = screen.getByRole("region", { name: "Podio N0" });
    expect(within(n0).getByText("Red Invisible")).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Ganadores por nivel" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Podio Externos" })).toBeNull();
    expect(container.textContent).not.toMatch(/Externos|externos/);
  });

  it("muestra la ponderación configurada con los jurados junior (HU-34)", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    renderPage();
    expect(await screen.findByText("Nota final: 60 % profesores y 40 % jurados junior")).toBeTruthy();
  });

  it("los empates y decisiones se llaman por su nivel", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    fetchRankingTies.mockResolvedValue([N0_TIE]);
    fetchRankingDecisions.mockResolvedValue([N0_DECISION]);
    renderPage();

    expect(await screen.findByText("N0 · 3.60")).toBeTruthy();
    expect(screen.getByText("N0", { selector: "strong" })).toBeTruthy();
    expect(screen.getByText("Mejor presentación")).toBeTruthy();
  });

  it("al elegir un nivel no habla de ningún grupo Externos", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    const { container } = renderPage();
    await screen.findByRole("region", { name: "Podio N1" });

    fetchRanking.mockResolvedValue({ ...snapshot(), levels: [N1] });
    fireEvent.change(screen.getByDisplayValue("Todos los niveles"), { target: { value: "1" } });

    await waitFor(() => expect(fetchRanking).toHaveBeenLastCalledWith({ level: 1, top: 3 }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Podio N0" })).toBeNull());
    expect(container.textContent).not.toMatch(/Externos/);
  });

  it("el cierre cuenta solo los niveles", async () => {
    fetchRanking.mockResolvedValue(snapshot());
    finalizeRanking.mockResolvedValue({
      editionId: 3,
      teams: 4,
      levels: [
        { level: 0, label: "N0", teams: 2 },
        { level: 1, label: "N1", teams: 2 },
      ],
    });
    vi.stubGlobal("confirm", () => true);
    renderPage();
    await screen.findByRole("region", { name: "Podio N1" });

    fireEvent.click(screen.getByRole("button", { name: "Definir ranking final" }));
    expect(await screen.findByText("Ranking final definido: 4 grupos en 2 niveles.")).toBeTruthy();
  });
});

describe("/tiebreaker en solo lectura: empates resueltos por inscripción (HU-47, ARK-305)", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    fetchRanking.mockResolvedValue(snapshot());
    fetchRankingDecisions.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("pide todos los empates (sin status) y los muestra en el orden resuelto, con el motivo", async () => {
    fetchRankingTies.mockResolvedValue([N0_TIE]);
    renderPage();
    const tie = await screen.findByRole("article", { name: "Empate N0 3.60" });
    expect(fetchRankingTies).toHaveBeenCalledWith();
    expect(within(tie).getByText("Resuelto por fecha de inscripción")).toBeTruthy();
    const names = within(tie).getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(names[0]).toMatch(/^2\.Faro.*inscrito el 03\/10\/2026/);
    expect(names[1]).toMatch(/^3\.Red Invisible.*inscrito el 05\/10\/2026/);
    expect(within(tie).getByText("Resuelto por fecha de inscripción: primero el grupo inscrito antes.")).toBeTruthy();
    expect(tie.textContent).not.toContain("T15:00:00");
  });

  it("no hay controles para decidir", async () => {
    fetchRankingTies.mockResolvedValue([N0_TIE]);
    renderPage();
    await screen.findByRole("article", { name: "Empate N0 3.60" });
    expect(screen.queryByRole("button", { name: /Resolver|Guardar decisión/ })).toBeNull();
    expect(screen.queryByPlaceholderText(/Motivo/)).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/pendiente/i)).toBeNull();
  });

  it("un equipo sin fecha de inscripción se marca", async () => {
    fetchRankingTies.mockResolvedValue([
      { ...N0_TIE, teams: [N0_TIE.teams[1], { ...N0_TIE.teams[0], registrationDate: null }], order: [12, 11] },
    ]);
    renderPage();
    expect(await screen.findByText("Sin fecha de inscripción (va después)")).toBeTruthy();
  });

  it("al elegir un nivel solo muestra los empates de ese nivel", async () => {
    fetchRankingTies.mockResolvedValue([N0_TIE, { ...N0_TIE, tieKey: "3:N1:4.50:1,40", level: 1, score: 4.5 }]);
    renderPage();
    await screen.findByRole("article", { name: "Empate N1 4.50" });
    expect(screen.getByText("Empates (2)")).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("Todos los niveles"), { target: { value: "1" } });
    await waitFor(() => expect(screen.queryByRole("article", { name: "Empate N0 3.60" })).toBeNull());
    expect(screen.getByRole("article", { name: "Empate N1 4.50" })).toBeTruthy();
  });

  it("las decisiones guardadas antes quedan como historial que no cambia el orden", async () => {
    fetchRankingTies.mockResolvedValue([]);
    fetchRankingDecisions.mockResolvedValue([N0_DECISION]);
    renderPage();
    expect(await screen.findByRole("heading", { name: "Decisiones anteriores" })).toBeTruthy();
    expect(screen.getByText("Quedan como historial: ya no cambian el orden del ranking.")).toBeTruthy();
    expect(screen.getByText((_, el) => el?.tagName === "P" && el.textContent === "N0 · Administrador")).toBeTruthy();
    expect(screen.getByText("No hay empates.")).toBeTruthy();
  });

  it("una decisión por inscripción del historial no muestra las fechas en ISO", async () => {
    fetchRankingTies.mockResolvedValue([]);
    fetchRankingDecisions.mockResolvedValue([
      { ...N0_DECISION, method: "REGISTRATION", reason: N0_TIE.explanation },
    ]);
    renderPage();
    expect(await screen.findByText("Resuelto por fecha de inscripción: primero el grupo inscrito antes.")).toBeTruthy();
    expect(document.body.textContent).not.toContain("T15:00:00");
  });

  it("«Definir ranking final» no se bloquea por empates", async () => {
    fetchRankingTies.mockResolvedValue([N0_TIE]);
    finalizeRanking.mockResolvedValue({ editionId: 3, teams: 4, levels: [{ level: 0, label: "N0", teams: 4 }], registeredDecisions: 1 });
    vi.stubGlobal("confirm", () => true);
    renderPage();
    await screen.findByRole("article", { name: "Empate N0 3.60" });
    const button = screen.getByRole("button", { name: "Definir ranking final" });
    expect(button.hasAttribute("disabled")).toBe(false);
    fireEvent.click(button);
    expect(await screen.findByText("Ranking final definido: 4 grupos en 1 nivel.")).toBeTruthy();
  });
});
