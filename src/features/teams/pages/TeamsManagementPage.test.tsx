import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeamsManagementPage from "@/features/teams/pages/TeamsManagementPage";

vi.mock("@/layouts/LayoutApplication", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/api/editions", () => ({ fetchEditions: vi.fn(async () => []) }));
vi.mock("@/features/teams/components/TeamWizardDialog", () => ({
  default: () => null,
  toInitialValuesFromTeam: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api", () => ({ apiFetch }));

const apiTeam = (id: number, teamName: string, isExternal = false) => ({
  id,
  teamName,
  teamCode: `N2-ABC-${id}`,
  isExternal,
  editionId: 3,
  members: [{ id: id * 10, firstName: "Ana", lastName: "Ruiz", email: `lider${id}@uninorte.edu.co`, nrcs: [] }],
  videogame: { id, name: `Juego ${id}`, videogameStatusId: 1 },
});

// 20 Uninorte + 2 externos en la edición; «Nébula Guardianes» está en la página 3 sin filtros
const EDITION_TEAMS = [
  ...Array.from({ length: 20 }, (_, i) => apiTeam(i + 1, `Equipo ${i + 1}`)),
  apiTeam(21, "Nébula Guardianes", true),
  apiTeam(22, "Los Lejanos", true),
];

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

/** Simula `GET /teams` del back con `search` y `origin` filtrados en la consulta. */
const backendTeams = (url: URL) => {
  const page = Number(url.searchParams.get("page"));
  const limit = Number(url.searchParams.get("limit"));
  const search = url.searchParams.get("search")?.toLowerCase();
  const origin = url.searchParams.get("origin");
  const filtered = EDITION_TEAMS.filter(
    (t) =>
      (!origin || t.isExternal === (origin === "externo")) &&
      (!search || t.teamName.toLowerCase().includes(search)),
  );
  const itemsPerPage = Math.min(limit, 1000);
  const data = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  return {
    edition: { id: 3, title: "2026-2", status: "ACTIVE", readOnly: false },
    data,
    metaData: {
      totalItems: filtered.length,
      itemsOnCurrentPage: data.length,
      currentPage: page,
      itemsPerPage,
      totalPages: Math.ceil(filtered.length / itemsPerPage),
    },
  };
};

const teamsRequests = () =>
  apiFetch.mock.calls
    .map(([u]) => new URL(String(u)))
    .filter((u) => u.pathname === "/teams" && u.searchParams.has("page"));
const lastTeamsRequest = () => teamsRequests().at(-1)!;

// La página monta la tabla completa: con toda la suite en paralelo cada render tarda segundos
const WAIT = { timeout: 8000 };

describe("Equipos Inscritos: búsqueda y origen en el back (BG-53 / ARK-254)", { timeout: 30000 }, () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Element.prototype.scrollIntoView = vi.fn();
    apiFetch.mockImplementation(async (input: string) => {
      const url = new URL(input);
      if (url.pathname === "/subjects") return json({ data: [] });
      if (url.pathname.startsWith("/teams/leader/")) {
        return json({ confirmationStatus: { id: 1, status: "Confirmado", isActive: true } });
      }
      if (url.pathname === "/teams" && !url.searchParams.has("page")) {
        return json({ data: EDITION_TEAMS }); // contadores de la edición
      }
      if (url.pathname === "/teams") return json(backendTeams(url));
      throw new Error(`URL no esperada: ${input}`);
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const goToPage2 = async () => {
    render(<TeamsManagementPage />);
    expect(await screen.findByText("Equipo 1", undefined, WAIT)).toBeTruthy();
    expect(screen.getByText("1 de 3")).toBeTruthy();
    const next = screen.getByRole("button", { name: "Página siguiente" });
    fireEvent.click(next);
    expect(await screen.findByText("Equipo 11", undefined, WAIT)).toBeTruthy();
  };

  it("busca un equipo de otra página en el back, vuelve a la página 1 y recalcula la paginación", async () => {
    await goToPage2();

    const input = screen.getByRole("searchbox", { name: "Buscar equipos" });
    fireEvent.change(input, { target: { value: "Né" } });
    fireEvent.change(input, { target: { value: "Nébula" } });

    expect(await screen.findByText("Nébula Guardianes", undefined, WAIT)).toBeTruthy();
    const req = lastTeamsRequest();
    expect(req.searchParams.get("search")).toBe("Nébula");
    expect(req.searchParams.get("page")).toBe("1");
    expect(screen.getByText("1 de 1")).toBeTruthy();
    // con el debounce no sale una petición por tecla
    expect(teamsRequests().some((u) => u.searchParams.get("search") === "Né")).toBe(false);
  });

  it("«Externos» pide origin=externo y la paginación coincide con el contador", async () => {
    await goToPage2();

    fireEvent.click(screen.getByRole("button", { name: "Externos (2)" }));

    expect(await screen.findByText("Los Lejanos", undefined, WAIT)).toBeTruthy();
    const req = lastTeamsRequest();
    expect(req.searchParams.get("origin")).toBe("externo");
    expect(req.searchParams.get("page")).toBe("1");
    expect(screen.getByText("Nébula Guardianes")).toBeTruthy();
    expect(screen.getByText("1 de 1")).toBeTruthy();
    expect(screen.queryByText("Equipo 1")).toBeNull();

    // «Todos» quita el origen
    fireEvent.click(screen.getByRole("button", { name: "Todos (22)" }));
    expect(await screen.findByText("Equipo 1", undefined, WAIT)).toBeTruthy();
    expect(lastTeamsRequest().searchParams.has("origin")).toBe(false);
  });

  it("los contadores se piden una vez y no con cada búsqueda o cambio de página", async () => {
    await goToPage2();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar equipos" }), { target: { value: "Lejanos" } });
    expect(await screen.findByText("Los Lejanos", undefined, WAIT)).toBeTruthy();

    const countRequests = apiFetch.mock.calls
      .map(([u]) => new URL(String(u)))
      .filter((u) => u.pathname === "/teams" && !u.searchParams.has("page"));
    expect(countRequests).toHaveLength(1);
  });

  it("si una respuesta vieja llega tarde no reemplaza la de la búsqueda", async () => {
    render(<TeamsManagementPage />);
    expect(await screen.findByText("Equipo 1", undefined, WAIT)).toBeTruthy();

    // La página 2 tarda; mientras tanto se busca y la búsqueda responde primero
    let releasePage2: () => void = () => {};
    const defaultImpl = apiFetch.getMockImplementation()!;
    apiFetch.mockImplementation(async (input: string) => {
      const url = new URL(input);
      if (url.pathname === "/teams" && url.searchParams.get("page") === "2" && !url.searchParams.has("search")) {
        await new Promise<void>((resolve) => (releasePage2 = resolve));
      }
      return defaultImpl(input);
    });
    const next = screen.getByRole("button", { name: "Página siguiente" });
    fireEvent.click(next);
    await waitFor(() => expect(lastTeamsRequest().searchParams.get("page")).toBe("2"), WAIT);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar equipos" }), { target: { value: "Lejanos" } });
    expect(await screen.findByText("Los Lejanos", undefined, WAIT)).toBeTruthy();

    releasePage2();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Los Lejanos")).toBeTruthy();
    expect(screen.queryByText("Equipo 11")).toBeNull();
  });
});
