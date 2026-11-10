import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/grupo 9/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AuthContextType, Role } from "@/types/auth";

const auth: Partial<AuthContextType> = {};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

// La insignia de edición del administrador pide las ediciones
vi.mock("@/fetchs/editions", () => ({
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
