import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  GlobalStateProvider,
  JuradosAuthSync,
} from "@/fetchs/grupo 1/GlobalStateContext";

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

// Backend simulado: sin sesión, /auth/refresh da 401 y JuradosData también.
function stubBackend(withSession: boolean) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === `${API}/auth/refresh`) {
      return withSession
        ? json(201, { accessToken: "t", accessTokenExpiresIn: 900 })
        : json(401, {});
    }
    if (url === `${API}/auth/me`) {
      return withSession ? json(200, PROFILE) : json(401, {});
    }
    if (url === `${API}/reports/JuradosData`) {
      return withSession ? json(200, []) : json(401, {});
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

async function mount() {
  render(
    <GlobalStateProvider>
      <AuthProvider>
        <JuradosAuthSync />
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
