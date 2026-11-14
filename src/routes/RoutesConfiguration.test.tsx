import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import { TextSizeProvider } from "@/contexts/TextSizeContext";
import RoutesConfiguration, { routes } from "@/routes/RoutesConfiguration";

// HomePage depende de matchMedia y de otras peticiones: aquí solo importa a dónde se llega
vi.mock("@/features/home/pages/HomePage", () => ({
  default: () => <p>Inicio del rol</p>,
}));

const API = import.meta.env.VITE_ENDPOINT_BACKEND;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const PROFILE = {
  id: "u-1",
  firstName: "Ana",
  lastName: "Test",
  email: "ana@test.co",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  role: { name: "Jurado", description: "Jurado" },
  confirmationStatus: { status: "CONFIRMADO" },
};

// Backend simulado: sin sesión (refresh 401) o con sesión de jurado.
function stubBackend({
  session,
  role = "Jurado",
}: {
  session: boolean;
  role?: string;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === `${API}/auth/refresh`) {
        return session
          ? json(201, { accessToken: "t", accessTokenExpiresIn: 900 })
          : json(401, { message: "Unauthorized" });
      }
      if (url === `${API}/auth/me`) {
        return json(200, { ...PROFILE, role: { name: role, description: role } });
      }
      if (url === `${API}/auth/login`) {
        return json(401, { message: "Credenciales inválidas" });
      }
      if (url === `${API}/settings/registrations`) {
        return json(200, { registrationsOpen: false });
      }
      return json(404, {});
    }),
  );
}

const renderApp = (path: string) => {
  window.history.pushState({}, "", path);
  return render(
    <TextSizeProvider>
      <AuthProvider>
        <RoutesConfiguration />
      </AuthProvider>
    </TextSizeProvider>,
  );
};

describe("RoutesConfiguration (SP1: login, 404 y pantallas de relleno)", () => {
  beforeEach(() => {
    document.documentElement.className = "";
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("login con clave incorrecta muestra el mensaje y conserva el correo", async () => {
    stubBackend({ session: false });
    renderApp("/login");

    const email = (await screen.findByLabelText("Email")) as HTMLInputElement;
    fireEvent.change(email, { target: { value: "ana@test.co" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "mala" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText("Credenciales inválidas")).toBeTruthy();
    expect(
      (screen.getByLabelText("Email") as HTMLInputElement).value,
    ).toBe("ana@test.co");
  });

  it("una ruta inexistente muestra la página 404", async () => {
    stubBackend({ session: false });
    renderApp("/esta-ruta-no-existe");

    expect(await screen.findByText("Página no encontrada")).toBeTruthy();
  });

  it("/registro-equipo con inscripciones cerradas muestra «Inscripciones cerradas»", async () => {
    stubBackend({ session: false });
    renderApp("/registro-equipo");

    expect(await screen.findByText("Inscripciones cerradas")).toBeTruthy();
  });

  it.each([
    ["/jurado", "Jurado"],
    ["/profesor", "Profesor"],
  ])(
    "%s redirige al inicio del rol",
    async (path, role) => {
      stubBackend({ session: true, role });
      renderApp(path);

      expect(await screen.findByText("Inicio del rol")).toBeTruthy();
      expect(window.location.pathname).toBe("/inicio");
    },
  );
});

describe("routes", () => {
  it("declara cada ruta una sola vez (/materias incluida)", () => {
    const paths = routes.map((r) => r.path);
    const duplicated = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(duplicated).toEqual([]);
    expect(paths.filter((p) => p === "/materias")).toHaveLength(1);
  });

  it("HU-33: la pantalla de presentadores es del administrador y /mi-registro del presentador", () => {
    const rolesOf = (path: string) => routes.find((r) => r.path === path)?.roles;
    expect(rolesOf("/presentadores-externos")).toEqual(["Administrador"]);
    expect(rolesOf("/mi-registro")).toEqual(["Presentador externo"]);
    // Entra a /inicio, que lo redirige a su panel
    expect(rolesOf("/inicio")).toContain("Presentador externo");
  });

  it("restringe la guía de instalación al rol Jurado", () => {
    const installGuide = routes.find((route) => route.path === "/instalar-app");
    expect(installGuide?.roles).toEqual(["Jurado"]);
  });
});
