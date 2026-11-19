import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/features/home/pages/HomePage";
import type { AuthContextType } from "@/types/auth";
import type { ReactNode } from "react";

const auth: Partial<AuthContextType> = {};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));
// El inicio de los demás roles: solo interesa el saludo (BG-66)
vi.mock("@/layouts/LayoutApplication", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/TeamCode", () => ({ default: () => null }));
vi.mock("@/features/teams/components/VerificationCode", () => ({ default: () => null }));
vi.mock("@/components/CircularProgress", () => ({ default: () => null }));
vi.mock("@/components/JurorPresenceNotice", () => ({ JurorPresenceNotice: () => null }));
vi.mock("@/components/JurorSurveyAccess", () => ({ JurorSurveyAccess: () => null }));
vi.mock("@/features/jurors/substitutes/components/SubstituteGuideAccess", () => ({ SubstituteGuideAccess: () => null }));
vi.mock("@/features/pwa/components/PwaInstallNotice", () => ({ PwaInstallNotice: () => null }));

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={["/inicio"]}>
      <Routes>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/check-in-jurados" element={<p>Registrar llegada</p>} />
        <Route path="/mi-registro" element={<p>Mi registro</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("HomePage: inicio de los roles con un solo panel", () => {
  afterEach(cleanup);

  it("el presentador externo va directo a /mi-registro (HU-33)", () => {
    Object.assign(auth, { user: { firstName: "Ana" }, userRole: "Presentador externo" });
    renderHome();

    expect(screen.getByText("Mi registro")).toBeTruthy();
    expect(screen.queryByText(/bienvenida a Arkad/)).toBeNull();
  });

  it("Staff sigue yendo al check-in de jurados", () => {
    Object.assign(auth, { user: { firstName: "Sam" }, userRole: "Staff" });
    renderHome();

    expect(screen.getByText("Registrar llegada")).toBeTruthy();
  });
});

describe("HomePage: saludo (BG-66)", () => {
  afterEach(cleanup);

  it("da la bienvenida sin suponer el género de quien entra", () => {
    Object.assign(auth, { user: { firstName: "Alex" }, userRole: "Profesor" });
    renderHome();

    expect(screen.getByRole("heading", { name: "¡Te damos la bienvenida a Arkad!" })).toBeTruthy();
    expect(screen.queryByText(/¡Bienvenido/)).toBeNull();
    expect(screen.getByText("Estamos encantados de tenerte, Alex")).toBeTruthy();
  });
});
