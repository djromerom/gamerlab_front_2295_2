import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LayoutAplication from "@/layouts/LayoutAplication";

// El sidebar real depende de la sesión: aquí solo importa el marco del layout
vi.mock("@/components/grupo 9/app-sidebar", () => ({
  AppSidebar: () => <nav>Menú lateral</nav>,
}));

describe("LayoutAplication", () => {
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

  it("muestra el sidebar, las migas desde Inicio y el contenido", () => {
    render(
      <MemoryRouter>
        <LayoutAplication breadcrumbs={[{ label: "Configuración", href: "/configuracion" }]}>
          <p>Contenido de la página</p>
        </LayoutAplication>
      </MemoryRouter>,
    );

    expect(screen.getByText("Menú lateral")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe("/inicio");
    expect(screen.getByRole("link", { name: "Configuración" }).getAttribute("href")).toBe("/configuracion");
    expect(screen.getByText("Contenido de la página")).toBeTruthy();
  });
});
