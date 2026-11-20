import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

// Lo que devuelve el back desde ARK-306: solo el podio de cada nivel y sin nota.
const row = (teamId: number, teamCode: string, teamName: string, videogameName: string, level: number, levelPosition: number, isExternal = false) => ({
  teamId,
  teamCode,
  teamName,
  isExternal,
  videogameId: teamId,
  videogameName,
  logoUrl: null,
  videogameLogoUrl: null,
  editionId: 5,
  level,
  levelPosition,
  position: levelPosition,
});

// Llegan desordenados a propósito: el puesto sale de levelPosition. Un externo compite en su nivel (ARK-272).
const PODIUM = [
  row(3, "N1-ABC-103", "Operación de Datos", "Datos", 1, 3, true),
  row(1, "N1-ABC-101", "Pixel Hunters", "Stella", 1, 1),
  row(2, "N1-ABC-102", "Code Knights", "Nova", 1, 2),
  row(50, "N0-COL-001", "Aventura Escolar", "Isla", 0, 1),
  row(20, "N2-ABC-201", "Delta", "Juego Delta", 2, 1),
  row(21, "N2-ABC-202", "Gamma", "Juego Gamma", 2, 2),
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let showRanking = true;
let podium: unknown[] = PODIUM;

const renderPage = () =>
  render(
    <MemoryRouter>
      <RankingPage />
    </MemoryRouter>,
  );

describe("/ranking público: solo el podio de cada nivel y sin notas (HU-48, ARK-307)", () => {
  beforeEach(() => {
    showRanking = true;
    podium = PODIUM;
    apiFetch.mockImplementation((url: string) => {
      if (url.endsWith("/settings/show-ranking")) return Promise.resolve(json({ showRanking }));
      if (url.endsWith("/teams/final-score/by-n/all")) return Promise.resolve(json(podium));
      return Promise.resolve(json({}, 404));
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("solo hay pestañas de los niveles que llegan, sin «Todos» ni «Externos», y empieza en el primero", async () => {
    renderPage();
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Primer Semestre", "Segundo Semestre", "Colegios"]);
    expect(screen.queryByRole("tab", { name: "Todos" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Externos" })).toBeNull();
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    // una sola consulta: by-n/all se reparte por nivel en el front
    expect(apiFetch.mock.calls.filter(([url]) => String(url).includes("/by-n/"))).toHaveLength(1);
  });

  it("cada puesto sale por levelPosition con equipo y videojuego, sin nota ni lista debajo", async () => {
    const { container } = renderPage();
    const podiumList = await screen.findByRole("list", { name: "Podio Primer Semestre" });
    expect(within(podiumList).getByRole("listitem", { name: "Primer puesto: Pixel Hunters" }).textContent).toContain("Stella");
    expect(within(podiumList).getByRole("listitem", { name: "Segundo puesto: Code Knights" })).toBeTruthy();
    expect(within(podiumList).getByRole("listitem", { name: "Tercer puesto: Operación de Datos" })).toBeTruthy();
    expect(container.textContent).not.toMatch(/\d\.\d{2}/);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText(/Otras Posiciones|Ranking General/)).toBeNull();
  });

  it("no muestra la ponderación ni «Empate pendiente»", async () => {
    const { container } = renderPage();
    await screen.findByRole("list", { name: "Podio Primer Semestre" });
    expect(container.textContent).not.toMatch(/%|profesores|jurados|Empate pendiente/);
  });

  it("al elegir otro nivel muestra su podio; con menos de 3 equipos solo los que hay (A1)", async () => {
    renderPage();
    await screen.findByRole("list", { name: "Podio Primer Semestre" });
    fireEvent.click(screen.getByRole("tab", { name: "Segundo Semestre" }));
    const podiumList = await screen.findByRole("list", { name: "Podio Segundo Semestre" });
    expect(within(podiumList).getAllByRole("listitem")).toHaveLength(2);
    expect(within(podiumList).queryByRole("listitem", { name: /Tercer puesto/ })).toBeNull();
    expect(screen.getByRole("tab", { name: "Segundo Semestre" }).getAttribute("aria-selected")).toBe("true");
  });

  it("sin publicar muestra el aviso de siempre y no pide el podio", async () => {
    showRanking = false;
    renderPage();
    expect(await screen.findByText(/El ranking aún no está disponible/)).toBeTruthy();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(apiFetch.mock.calls.some(([url]) => String(url).includes("/by-n/"))).toBe(false);
  });

  it("publicado pero sin equipos con nota lo dice", async () => {
    podium = [];
    renderPage();
    expect(await screen.findByText("Aún no hay equipos con nota.")).toBeTruthy();
  });

  it("si falla la consulta muestra el error y permite reintentar", async () => {
    let fail = true;
    apiFetch.mockImplementation((url: string) => {
      if (url.endsWith("/settings/show-ranking")) return Promise.resolve(json({ showRanking: true }));
      return Promise.resolve(fail ? json({}, 500) : json(PODIUM));
    });
    renderPage();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("No se pudo cargar el ranking (error 500).");
    fail = false;
    fireEvent.click(within(alert).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.getByRole("list", { name: "Podio Primer Semestre" })).toBeTruthy());
  });
});
