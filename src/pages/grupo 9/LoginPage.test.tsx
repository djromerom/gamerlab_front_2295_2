import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/components/grupo 9/ProtectedRoute";
import { TextSizeProvider } from "@/contexts/TextSizeContext";
import LoginPage from "@/pages/grupo 9/LoginPage";
import type { AuthContextType, Role } from "@/types/auth";

const auth: Partial<AuthContextType> = {};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

function RatePageStub() {
  const location = useLocation();
  return <p>Calificando {location.state?.game?.nombre}</p>;
}

// Se crea un elemento nuevo en cada render para que React vuelva a llamar a useAuth;
// el MemoryRouter conserva su historial porque ocupa la misma posición en el árbol.
const app = () => (
  <TextSizeProvider>
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/pendientes-calificar/7",
          state: { game: { id: 7, nombre: "Juego X" } },
        },
      ]}
    >
      <Routes>
        <Route element={<ProtectedRoute roles={["Jurado"]} />}>
          <Route path="/pendientes-calificar/:id" element={<RatePageStub />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/inicio" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>
  </TextSizeProvider>
);

// Muestra el state con el que se llegó al login, para comprobar que "Salir" no guarda ruta de origen
function LoginWithState() {
  const location = useLocation();
  return (
    <>
      <LoginPage />
      <output data-testid="login-state">
        {JSON.stringify(location.state ?? null)}
      </output>
    </>
  );
}

// Una pantalla protegida por rol, como en RoutesConfiguration
const ROLE_SCREENS: Record<Role, string> = {
  Jurado: "/pendientes-calificar/7",
  Estudiante: "/mis-equipos",
  Administrador: "/admin/usuarios",
  Profesor: "/profesor/cursos",
  Consultor: "/consultor/reportes",
  Staff: "/staff/puntos",
};

const roleApp = (initialPath: string) => (
  <TextSizeProvider>
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {(Object.keys(ROLE_SCREENS) as Role[]).map((role) => (
          <Route key={role} element={<ProtectedRoute roles={[role]} />}>
            <Route
              path={ROLE_SCREENS[role]}
              element={<p>Pantalla de {role}</p>}
            />
          </Route>
        ))}
        <Route path="/login" element={<LoginWithState />} />
        <Route path="/inicio" element={<p>Inicio</p>} />
        <Route path="/unauthorized" element={<p>Acceso no autorizado</p>} />
      </Routes>
    </MemoryRouter>
  </TextSizeProvider>
);

const signIn = (role: Role) =>
  Object.assign(auth, {
    user: { email: `${role.toLowerCase()}@test.co`, role: { name: role } },
    userRole: role,
    loading: false,
    sessionExpired: false,
    signedOut: false,
    login: vi.fn(),
  });

describe("LoginPage: cambio de rol después de cerrar sesión (BG-08)", () => {
  afterEach(cleanup);

  it.each<[Role, Role]>([
    ["Jurado", "Estudiante"],
    ["Estudiante", "Jurado"],
    ["Administrador", "Estudiante"],
    ["Profesor", "Jurado"],
  ])(
    "%s cierra sesión con Salir y entra como %s: llega a /inicio sin ver Acceso no autorizado",
    (fromRole, toRole) => {
      signIn(fromRole);
      const path = ROLE_SCREENS[fromRole];
      const { rerender } = render(roleApp(path));
      expect(screen.getByText(`Pantalla de ${fromRole}`)).toBeTruthy();

      // Presiona "Salir": AuthContext marca el cierre voluntario
      Object.assign(auth, { user: null, userRole: null, signedOut: true });
      rerender(roleApp(path));

      expect(screen.getByRole("button", { name: "Ingresar" })).toBeTruthy();
      expect(screen.getByTestId("login-state").textContent).toBe("null");
      expect(screen.queryByRole("alert")).toBeNull();

      // Entra otra cuenta con otro rol en el mismo navegador
      signIn(toRole);
      rerender(roleApp(path));

      expect(screen.getByText("Inicio")).toBeTruthy();
      expect(screen.queryByText("Acceso no autorizado")).toBeNull();
    },
  );

  it("si la sesión vence y entra otro rol sin permiso en la ruta de origen, va a /inicio", () => {
    Object.assign(auth, {
      user: null,
      userRole: null,
      loading: false,
      sessionExpired: true,
      signedOut: false,
      login: vi.fn(),
    });
    const path = ROLE_SCREENS.Jurado;
    const { rerender } = render(roleApp(path));

    // La sesión vencida sí guarda la ruta de origen y los roles que la permiten
    expect(
      JSON.parse(screen.getByTestId("login-state").textContent!),
    ).toMatchObject({ from: { pathname: path }, roles: ["Jurado"] });

    signIn("Estudiante");
    rerender(roleApp(path));

    expect(screen.getByText("Inicio")).toBeTruthy();
    expect(screen.queryByText("Acceso no autorizado")).toBeNull();
  });
});

describe("LoginPage: sesión expirada (HU-05)", () => {
  afterEach(cleanup);

  it("avisa que la sesión expiró y al iniciar sesión vuelve a la calificación con su state", () => {
    Object.assign(auth, {
      user: null,
      userRole: null,
      loading: false,
      sessionExpired: true,
      login: vi.fn(),
    });
    const { rerender } = render(app());

    expect(screen.getByRole("alert").textContent).toContain(
      "Tu sesión expiró",
    );

    // El jurado inicia sesión de nuevo
    Object.assign(auth, {
      user: { email: "jurado@test.co", role: { name: "Jurado" } },
      userRole: "Jurado",
      sessionExpired: false,
    });
    rerender(app());

    expect(screen.getByText("Calificando Juego X")).toBeTruthy();
  });

  it("sin ruta de origen, después del login va a /inicio", () => {
    Object.assign(auth, {
      user: { email: "jurado@test.co", role: { name: "Jurado" } },
      userRole: "Jurado",
      loading: false,
      sessionExpired: false,
    });
    render(
      <TextSizeProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/inicio" element={<p>Inicio</p>} />
          </Routes>
        </MemoryRouter>
      </TextSizeProvider>,
    );

    expect(screen.getByText("Inicio")).toBeTruthy();
  });

  it("el campo de contraseña pide autocomplete current-password", () => {
    Object.assign(auth, {
      user: null,
      userRole: null,
      loading: false,
      sessionExpired: false,
      login: vi.fn(),
    });
    const { container } = render(
      <TextSizeProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </TextSizeProvider>,
    );

    expect(
      container.querySelector("#password")?.getAttribute("autocomplete"),
    ).toBe("current-password");
  });
});
