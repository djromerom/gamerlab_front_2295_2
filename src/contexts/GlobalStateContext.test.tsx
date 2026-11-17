import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  GlobalStateProvider,
  GlobalDataAuthSync,
  useGlobalState,
} from "@/contexts/GlobalStateContext";

const API = import.meta.env.VITE_ENDPOINT_BACKEND;

const PROFILE = {
  id: "juror-1",
  firstName: "Ana",
  lastName: "Jurado",
  email: "jurado@test.co",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  role: { name: "Jurado", description: "Jurado" },
  confirmationStatus: { status: "CONFIRMADO" },
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const ADMIN = { ...PROFILE, id: "admin-1", email: "admin@test.co", role: { name: "Administrador", description: "Administrador" } };
const ADMIN_REPORTS = ["videojuegoData", "NRCData", "DatosGraficoMateria"];

// Backend simulado: sin sesión, /auth/refresh da 401 y JuradosData también. Desde BG-67 las tres rutas de
// notas de /reports responden 401 sin sesión y 403 a quien no es Administrador.
function stubBackend(withSession: boolean, profile = PROFILE) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === `${API}/auth/refresh`) {
      return withSession
        ? json(201, { accessToken: "t", accessTokenExpiresIn: 900 })
        : json(401, {});
    }
    if (url === `${API}/auth/me`) {
      return withSession ? json(200, profile) : json(401, {});
    }
    if (url === `${API}/reports/JuradosData`) {
      return withSession ? json(200, []) : json(401, {});
    }
    if (ADMIN_REPORTS.some((r) => url.startsWith(`${API}/reports/${r}`))) {
      if (!withSession) return json(401, {});
      if (profile.role.name !== "Administrador") return json(403, {});
      return json(200, url.includes("videojuegoData") ? [{ id: 1, nombre: "Juego", promedio: 4.1 }] : []);
    }
    if (url.startsWith(`${API}/reports/`)) return json(200, []);
    if (url.startsWith(`${API}/settings/`)) return json(200, false);
    return json(404, {});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const juradosCalls = (fetchMock: ReturnType<typeof stubBackend>) =>
  fetchMock.mock.calls.filter(
    ([input]) => String(input) === `${API}/reports/JuradosData`,
  );

function ReportsProbe() {
  const { listaVideojuegos, error } = useGlobalState();
  return (
    <>
      <span data-testid="games">{listaVideojuegos.length}</span>
      <span data-testid="error">{error?.message ?? ""}</span>
    </>
  );
}

const reportCalls = (fetchMock: ReturnType<typeof stubBackend>) =>
  fetchMock.mock.calls
    .map(([input]) => String(input))
    .filter((url) => ADMIN_REPORTS.some((r) => url.startsWith(`${API}/reports/${r}`)));

async function mount() {
  render(
    <GlobalStateProvider>
      <AuthProvider>
        <GlobalDataAuthSync />
        <ReportsProbe />
      </AuthProvider>
    </GlobalStateProvider>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
}

describe("GlobalState: JuradosData solo con sesión", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("no pide /reports/JuradosData cuando no hay sesión", async () => {
    const fetchMock = stubBackend(false);
    await mount();

    expect(juradosCalls(fetchMock)).toHaveLength(0);
  });

  it("sí lo pide cuando hay usuario", async () => {
    const fetchMock = stubBackend(true);
    await mount();

    expect(juradosCalls(fetchMock).length).toBeGreaterThan(0);
  });
});

describe("GlobalState: notas de /reports solo para el Administrador (BG-67)", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sin sesión no pide videojuegoData, NRCData ni DatosGraficoMateria (solo materiaData) y no muestra error", async () => {
    const fetchMock = stubBackend(false);
    await mount();
    expect(reportCalls(fetchMock)).toHaveLength(0);
    expect(fetchMock.mock.calls.some(([u]) => String(u) === `${API}/reports/materiaData`)).toBe(true);
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("un jurado tampoco las pide", async () => {
    const fetchMock = stubBackend(true, PROFILE);
    await mount();
    expect(reportCalls(fetchMock)).toHaveLength(0);
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("el Administrador sí las pide y recibe los juegos con nota", async () => {
    const fetchMock = stubBackend(true, ADMIN);
    await mount();
    expect(new Set(reportCalls(fetchMock).map((u) => u.split("/").pop()))).toEqual(new Set(ADMIN_REPORTS));
    expect(screen.getByTestId("games").textContent).toBe("1");
  });
});
