import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/components/grupo 9/ProtectedRoute";
import { TextSizeProvider } from "@/contexts/TextSizeContext";
import LoginPage from "@/pages/grupo 9/LoginPage";
import type { AuthContextType } from "@/types/auth";

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
});
