import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/layouts/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AuthContextType, Role } from "@/types/auth";

const auth: Partial<AuthContextType> = {};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

// La insignia de edición del administrador pide las ediciones
vi.mock("@/api/editions", () => ({
  fetchEditions: () => Promise.resolve([]),
}));

const renderAs = (role: Role) => {
  Object.assign(auth, {
    userRole: role,
    user: { firstName: "Ana", lastName: "Pérez", email: "ana@empresa.com", role: { name: role } },
    logout: vi.fn(),
  });
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
};

const menuLinks = () =>
  screen
    .getAllByRole("link")
    .map((a) => a.getAttribute("href"))
    .filter((href) => href !== "/");

describe("Menú lateral: presentadores externos (HU-33)", () => {
  beforeEach(() => {
    // jsdom no implementa matchMedia y SidebarProvider lo usa para detectar móvil
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("el presentador externo solo ve «Mi registro»", () => {
    renderAs("Presentador externo");

    expect(screen.getByText("Mi registro")).toBeTruthy();
    expect(menuLinks()).toEqual(["/mi-registro"]);
  });

  it("el administrador tiene «Presentadores externos» en Personal", () => {
    renderAs("Administrador");

    const link = screen.getByRole("link", { name: /Presentadores externos/ });
    expect(link.getAttribute("href")).toBe("/presentadores-externos");
  });

  it("otros roles no ven la pantalla del administrador", () => {
    renderAs("Staff");

    expect(screen.queryByText("Presentadores externos")).toBeNull();
    expect(screen.queryByText("Mi registro")).toBeNull();
  });
});

describe("Menú lateral del profesor sin seguimiento ni «Mis empates» (ARK-297)", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("el profesor no ve «Seguimiento → Avance por hora» ni «Empates del ranking»", () => {
    renderAs("Profesor");

    expect(screen.queryByText("Seguimiento")).toBeNull();
    expect(screen.queryByText("Avance por hora")).toBeNull();
    expect(screen.queryByText("Empates del ranking")).toBeNull();
    expect(menuLinks()).not.toContain("/realtime-tracking-panel");
    expect(menuLinks()).not.toContain("/ranking/mis-empates");
    expect(menuLinks()).toEqual(["/home-profesor", "/colegios-calificar", "/colegios-evaluados", "/notificaciones"]);
  });

  it("el administrador sigue viendo el Panel de Seguimiento", () => {
    renderAs("Administrador");

    expect(screen.getByRole("link", { name: /Panel de Seguimiento/ }).getAttribute("href")).toBe("/realtime-tracking-panel");
  });
});
