import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { REFRESH_RETRY_DELAY_MS } from "@/lib/session";

const API = import.meta.env.VITE_ENDPOINT_BACKEND;
const MINUTE = 60 * 1000;

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

// Backend simulado: el access token vence a los 15 min y /evaluation responde 401 si está vencido,
// igual que el backend real después de ARK-88.
function createFakeBackend(accessTtlS = 900) {
  const state = { refreshValid: true, networkDown: false, accessExpiresAt: 0 };
  const calls = { refresh: 0, expiredAccess: 0 };

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === `${API}/auth/refresh`) {
      calls.refresh++;
      if (state.networkDown) throw new TypeError("Failed to fetch");
      if (!state.refreshValid) return json(401, { message: "Unauthorized" });
      state.accessExpiresAt = Date.now() + accessTtlS * 1000;
      return json(201, {
        accessToken: `token-${calls.refresh}`,
        accessTokenExpiresIn: accessTtlS,
      });
    }

    if (url === `${API}/auth/login`) return json(201, {});
    if (url === `${API}/auth/logout`) return json(201, {});

    const accessValid = Date.now() < state.accessExpiresAt;
    if (url === `${API}/auth/me`) {
      return accessValid ? json(200, PROFILE) : json(401, {});
    }
    if (url === `${API}/evaluation`) {
      if (!accessValid) {
        calls.expiredAccess++;
        return json(401, {});
      }
      return json(200, []);
    }
    return json(404, {});
  });

  vi.stubGlobal("fetch", fetchMock);
  return { state, calls };
}

function SessionProbe() {
  const { user, loading, sessionExpired, signedOut, login, logout } =
    useAuth();
  return (
    <>
      <span data-testid="user">
        {loading ? "loading" : (user?.email ?? "none")}
      </span>
      <span data-testid="expired">{String(sessionExpired)}</span>
      <span data-testid="signed-out">{String(signedOut)}</span>
      <button onClick={() => logout()}>Salir</button>
      <button
        onClick={() =>
          login({ email: PROFILE.email, password: "secreto" }).catch(() => {})
        }
      >
        Ingresar
      </button>
    </>
  );
}

const currentUser = () => screen.getByTestId("user").textContent;
const sessionExpired = () => screen.getByTestId("expired").textContent;
const signedOut = () => screen.getByTestId("signed-out").textContent;
const click = (name: string) =>
  act(async () => {
    screen.getByRole("button", { name }).click();
    await vi.advanceTimersByTimeAsync(0);
  });
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

async function startSession() {
  render(
    <AuthProvider>
      <SessionProbe />
    </AuthProvider>,
  );
  await advance(0);
  expect(currentUser()).toBe(PROFILE.email);
}

describe("AuthContext: sesión del jurado (HU-05)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mantiene una sesión de más de 60 minutos con actividad sin cierres ni tokens vencidos", async () => {
    const backend = createFakeBackend();
    await startSession();

    // El jurado hace una petición cada minuto durante 70 minutos
    for (let minute = 1; minute <= 70; minute++) {
      await advance(MINUTE);
      const res = await act(() => apiFetch(`${API}/evaluation`));
      expect(res.status).toBe(200);
    }

    expect(backend.calls.expiredAccess).toBe(0);
    expect(currentUser()).toBe(PROFILE.email);
    expect(sessionExpired()).toBe("false");
    // Renovación inicial + una cada 10 minutos (token de 15 min con margen de 5)
    expect(backend.calls.refresh).toBe(8);
  });

  it("si el refresh vence, cierra la sesión y la marca como expirada", async () => {
    const backend = createFakeBackend();
    await startSession();

    backend.state.refreshValid = false;
    await advance(10 * MINUTE);

    expect(currentUser()).toBe("none");
    expect(sessionExpired()).toBe("true");
    expect(signedOut()).toBe("false");
  });

  it("al presionar Salir cierra la sesión como voluntaria, no como expirada (BG-08)", async () => {
    createFakeBackend();
    await startSession();

    await click("Salir");

    expect(currentUser()).toBe("none");
    expect(signedOut()).toBe("true");
    expect(sessionExpired()).toBe("false");
  });

  it("al iniciar sesión de nuevo después de Salir deja de marcar el cierre voluntario", async () => {
    createFakeBackend();
    await startSession();
    await click("Salir");

    await click("Ingresar");

    expect(currentUser()).toBe(PROFILE.email);
    expect(signedOut()).toBe("false");
  });

  it("si falla la red al renovar, conserva la sesión y reintenta", async () => {
    const backend = createFakeBackend();
    await startSession();

    backend.state.networkDown = true;
    await advance(10 * MINUTE);
    expect(currentUser()).toBe(PROFILE.email);

    backend.state.networkDown = false;
    const refreshesBeforeRetry = backend.calls.refresh;
    await advance(REFRESH_RETRY_DELAY_MS);

    expect(backend.calls.refresh).toBe(refreshesBeforeRetry + 1);
    expect(currentUser()).toBe(PROFILE.email);
    expect(sessionExpired()).toBe("false");
  });

  it("renueva al volver a la pestaña si el temporizador quedó atrasado (equipo suspendido)", async () => {
    const backend = createFakeBackend();
    await startSession();
    const refreshesBefore = backend.calls.refresh;

    // El reloj avanza 20 min sin que se ejecuten los temporizadores, como en una suspensión
    vi.setSystemTime(Date.now() + 20 * MINUTE);
    document.dispatchEvent(new Event("visibilitychange"));
    await advance(0);

    expect(backend.calls.refresh).toBe(refreshesBefore + 1);
    const res = await act(() => apiFetch(`${API}/evaluation`));
    expect(res.status).toBe(200);
  });

  it("si apiFetch no puede renovar, avisa al contexto y la sesión se marca como expirada", async () => {
    const backend = createFakeBackend();
    await startSession();

    backend.state.accessExpiresAt = 0;
    backend.state.refreshValid = false;
    const res = await act(() => apiFetch(`${API}/evaluation`));

    expect(res.status).toBe(401);
    expect(currentUser()).toBe("none");
    expect(sessionExpired()).toBe("true");
  });

  it("al cargar la app sin sesión no la marca como expirada", async () => {
    const backend = createFakeBackend();
    backend.state.refreshValid = false;

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await advance(0);

    expect(currentUser()).toBe("none");
    expect(sessionExpired()).toBe("false");
  });
});
